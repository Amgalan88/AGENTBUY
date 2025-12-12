const { prisma } = require("../config/db");

/**
 * Картын үлдэгдэл өөрчлөх (race condition-ээс сэргийлэх)
 * @param {Object} user - User object
 * @param {Number} diff - Өөрчлөлт (+ эсвэл -)
 * @param {String} type - Transaction type
 * @param {ObjectId} orderId - Order ID (optional)
 * @param {Object} meta - Additional metadata
 * @returns {Object} Updated user
 */
async function applyCardChange(user, diff, type, orderId, meta = {}) {
  // Race condition-ээс сэргийлэх: Database дээрх хамгийн сүүлийн balance-ийг авах
  const userId = user.id || user._id;
  const freshUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!freshUser) {
    const err = new Error("Хэрэглэгч олдсонгүй");
    err.statusCode = 404;
    throw err;
  }

  const currentBalance = freshUser.cardBalance || 0;
  const nextBalance = currentBalance + diff;
  
  if (nextBalance < 0) {
    const err = new Error("Картын үлдэгдэл хүрэлцэхгүй");
    err.statusCode = 400;
    throw err;
  }

  // Atomic update: Prisma transaction ашиглах
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { cardBalance: nextBalance },
  });

  if (!updatedUser) {
    const err = new Error("Картын үлдэгдэл шинэчлэхэд алдаа");
    err.statusCode = 500;
    throw err;
  }

  // Transaction log үүсгэх
  await prisma.cardTransaction.create({
    data: {
      userId: updatedUser.id,
      orderId: orderId || null,
      type,
      cardChange: diff,
      balanceAfter: nextBalance,
      meta: meta || {},
    },
  });

  return updatedUser;
}

/**
 * Захиалга нийтлэхэд карт хэрэглэх
 * Багц захиалга: 1-2 бараа = 1 карт, 3-4 = 2 карт, 5-6 = 3 карт, гэх мэт
 * Ганц захиалга: 1 карт
 */
async function consumeOnPublish(user, orderId, order = null) {
  if ((user.cardBalance || 0) <= 0) {
    const err = new Error("Карт хүрэлцэхгүй тул нийтэлж болохгүй");
    err.statusCode = 400;
    throw err;
  }

  // Захиалгын мэдээлэл авах (хэрэв order object өгөгдөөгүй бол)
  let orderData = order;
  if (!orderData && orderId) {
    orderData = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
  }

  // Багц захиалга эсэхийг шалгах
  let cardsToConsume = 1; // Default: 1 карт (ганц захиалга)
  if (orderData?.isPackage && orderData?.items && Array.isArray(orderData.items)) {
    const itemCount = orderData.items.length;
    // Багц захиалга: бараа бүр 1 карт
    cardsToConsume = itemCount;
    console.log(`[CardService] Багц захиалга: ${itemCount} бараа = ${cardsToConsume} карт хэрэглэнэ`);
  } else {
    console.log(`[CardService] Ганц захиалга: 1 карт хэрэглэнэ (isPackage: ${orderData?.isPackage}, items: ${orderData?.items?.length || 0})`);
  }

  // Картын үлдэгдэл хангалттай эсэхийг шалгах
  const userId = user.id || user._id;
  const freshUser = await prisma.user.findUnique({ where: { id: userId } });
  if ((freshUser.cardBalance || 0) < cardsToConsume) {
    const err = new Error(`Карт хүрэлцэхгүй. ${cardsToConsume} карт шаардлагатай`);
    err.statusCode = 400;
    throw err;
  }

  return applyCardChange(user, -cardsToConsume, "consume", orderId, {
    isPackage: orderData?.isPackage || false,
    itemCount: orderData?.items?.length || 1,
    cardsConsumed: cardsToConsume,
  });
}

/**
 * Захиалга цуцлагдсан үед карт буцаан олгох
 * Багц захиалга байсан бол хэрэглэсэн картын тоог буцаан олгох
 */
async function returnOnCancel(user, orderId) {
  // Transaction log-оос хэрэглэсэн картын тоог олох
  const userId = user.id || user._id;
  const consumeTransaction = await prisma.cardTransaction.findFirst({
    where: {
      userId: userId,
      orderId: orderId || null,
      type: "consume",
    },
    orderBy: { createdAt: "desc" },
  });

  if (consumeTransaction) {
    // Хэрэглэсэн картын тоог буцаан олгох
    const cardsToReturn = Math.abs(consumeTransaction.cardChange);
    return applyCardChange(user, cardsToReturn, "return", orderId, {
      reason: "order_cancelled",
      originalConsume: consumeTransaction.id,
    });
  } else {
    // Transaction олдохгүй бол default 1 карт буцаан олгох
    return applyCardChange(user, 1, "return", orderId, {
      reason: "order_cancelled",
    });
  }
}

/**
 * Админ төлбөр баталгаажуулсан үед карт буцаан олгох
 * 2 удаа амжилттай захиалга хийсэн бол нэмэлт 1 карт олгох
 */
async function onPaymentConfirmed(user, orderId) {
  // 1. Амжилттай захиалгын тооллогыг нэмэх (эхлээд тооллого нэмэх)
  const userId = user.id || user._id;
  const freshUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!freshUser) {
    throw new Error("Хэрэглэгч олдсонгүй");
  }
  
  const newCompletedCount = (freshUser.completedOrdersCount || 0) + 1;

  // 2. Карт буцаан олгох (амжилттай захиалга)
  await applyCardChange(freshUser, 1, "return", orderId, { reason: "payment_confirmed" });

  // 3. Хэрэв 2 удаа амжилттай захиалга хийсэн бол нэмэлт 1 карт олгох
  if (newCompletedCount % 2 === 0) {
    // 2, 4, 6, 8... удаа амжилттай бол бонус карт
    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    await applyCardChange(updatedUser, 1, "bonus_card", orderId, {
      reason: "completed_orders_bonus",
      completedCount: newCompletedCount,
    });
  }

  // Тооллогыг хадгалах
  await prisma.user.update({
    where: { id: userId },
    data: { completedOrdersCount: newCompletedCount },
  });
}

/**
 * Хуучин логик (backward compatibility)
 * @deprecated Use onPaymentConfirmed instead
 */
async function completeBonus(user, orderId) {
  // Эхний карт буцаалт
  await applyCardChange(user, 1, "return", orderId);

  // 0.5 картын бонус (progress)
  const userId = user.id || user._id;
  const freshUser = await prisma.user.findUnique({ where: { id: userId } });
  const nextProgress = (freshUser.cardProgress || 0) + 1;

  if (nextProgress >= 2) {
    await prisma.user.update({
      where: { id: userId },
      data: { cardProgress: nextProgress - 2 },
    });
    await applyCardChange(freshUser, 1, "bonus_card", orderId, { progressUsed: nextProgress });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { cardProgress: nextProgress },
    });
    await prisma.cardTransaction.create({
      data: {
        userId: userId,
        orderId: orderId || null,
        type: "bonus_progress",
        cardChange: 0,
        balanceAfter: freshUser.cardBalance,
        meta: { progress: nextProgress },
      },
    });
  }
}

module.exports = {
  applyCardChange,
  consumeOnPublish,
  returnOnCancel,
  completeBonus,
  onPaymentConfirmed,
};
