const CardTransaction = require("../models/cardTransactionModel");
const User = require("../models/userModel");

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
  const freshUser = await User.findById(user._id);
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

  // Atomic update: findOneAndUpdate ашиглах
  const updatedUser = await User.findByIdAndUpdate(
    freshUser._id,
    { $set: { cardBalance: nextBalance } },
    { new: true }
  );

  if (!updatedUser) {
    const err = new Error("Картын үлдэгдэл шинэчлэхэд алдаа");
    err.statusCode = 500;
    throw err;
  }

  // Transaction log үүсгэх
  await CardTransaction.create({
    userId: updatedUser._id,
    orderId,
    type,
    cardChange: diff,
    balanceAfter: nextBalance,
    meta,
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
  if (!orderData) {
    const Order = require("../models/orderModel");
    orderData = await Order.findById(orderId);
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
  const freshUser = await User.findById(user._id);
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
  const CardTransaction = require("../models/cardTransactionModel");
  const consumeTransaction = await CardTransaction.findOne({
    userId: user._id,
    orderId: orderId,
    type: "consume",
  }).sort({ createdAt: -1 });

  if (consumeTransaction) {
    // Хэрэглэсэн картын тоог буцаан олгох
    const cardsToReturn = Math.abs(consumeTransaction.cardChange);
    return applyCardChange(user, cardsToReturn, "return", orderId, {
      reason: "order_cancelled",
      originalConsume: consumeTransaction._id,
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
  const freshUser = await User.findById(user._id);
  if (!freshUser) {
    throw new Error("Хэрэглэгч олдсонгүй");
  }
  
  const newCompletedCount = (freshUser.completedOrdersCount || 0) + 1;

  // 2. Карт буцаан олгох (амжилттай захиалга)
  await applyCardChange(freshUser, 1, "return", orderId, { reason: "payment_confirmed" });

  // 3. Хэрэв 2 удаа амжилттай захиалга хийсэн бол нэмэлт 1 карт олгох
  if (newCompletedCount % 2 === 0) {
    // 2, 4, 6, 8... удаа амжилттай бол бонус карт
    const updatedUser = await User.findById(user._id);
    await applyCardChange(updatedUser, 1, "bonus_card", orderId, {
      reason: "completed_orders_bonus",
      completedCount: newCompletedCount,
    });
  }

  // Тооллогыг хадгалах
  await User.findByIdAndUpdate(user._id, {
    $set: { completedOrdersCount: newCompletedCount },
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
  const nextProgress = (user.cardProgress || 0) + 1;

  if (nextProgress >= 2) {
    user.cardProgress = nextProgress - 2;
    await user.save();
    await applyCardChange(user, 1, "bonus_card", orderId, { progressUsed: nextProgress });
  } else {
    user.cardProgress = nextProgress;
    await user.save();
    await CardTransaction.create({
      userId: user._id,
      orderId,
      type: "bonus_progress",
      cardChange: 0,
      balanceAfter: user.cardBalance,
      meta: { progress: user.cardProgress },
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
