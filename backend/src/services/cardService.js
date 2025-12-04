const CardTransaction = require("../models/cardTransactionModel");

async function applyCardChange(user, diff, type, orderId, meta = {}) {
  const nextBalance = (user.cardBalance || 0) + diff;
  if (nextBalance < 0) {
    const err = new Error("Картын үлдэгдэл хүрэлцэхгүй");
    err.statusCode = 400;
    throw err;
  }

  user.cardBalance = nextBalance;
  await user.save();

  await CardTransaction.create({
    userId: user._id,
    orderId,
    type,
    cardChange: diff,
    balanceAfter: nextBalance,
    meta,
  });

  return user;
}

async function consumeOnPublish(user, orderId) {
  if ((user.cardBalance || 0) <= 0) {
    const err = new Error("Карт хүрэлцэхгүй тул нийтэлж болохгүй");
    err.statusCode = 400;
    throw err;
  }
  return applyCardChange(user, -1, "consume", orderId);
}

async function returnOnCancel(user, orderId) {
  return applyCardChange(user, 1, "return", orderId);
}

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
};
