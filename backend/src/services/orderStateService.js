const { ORDER_STATUS, canTransition, ACTIVE_STATUSES } = require("../constants/orderStatus");

function assertTransition(fromStatus, toStatus, actorRole) {
  if (fromStatus === toStatus) {
    const err = new Error("Шинэ төлөв хуучинтай адил байна");
    err.statusCode = 400;
    throw err;
  }

  const ok = canTransition(fromStatus, toStatus, actorRole);
  if (!ok) {
    const err = new Error(`Энэ үйлдлийг зөвшөөрөхгүй (${fromStatus} -> ${toStatus})`);
    err.statusCode = 400;
    throw err;
  }
}

function isActiveStatus(status) {
  return ACTIVE_STATUSES.includes(status);
}

function isTerminal(status) {
  return !isActiveStatus(status);
}

module.exports = {
  assertTransition,
  isActiveStatus,
  isTerminal,
  ORDER_STATUS,
};
