const Order = require("../models/orderModel");
const { ORDER_STATUS } = require("../constants/orderStatus");

// Хугацаа дууссан lock-уудыг цэвэрлэх
async function cleanupExpiredLocks() {
  try {
    const now = new Date();
    
    const result = await Order.updateMany(
      {
        "lock.expiresAt": { $lt: now },
        status: { $in: [ORDER_STATUS.AGENT_LOCKED, ORDER_STATUS.AGENT_RESEARCHING] },
      },
      {
        $set: { status: ORDER_STATUS.PUBLISHED },
        $unset: { lock: 1, agentId: 1 },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[CLEANUP] ${result.modifiedCount} expired locks released at ${now.toISOString()}`);
    }
  } catch (err) {
    console.error("[CLEANUP] Error cleaning up expired locks:", err);
  }
}

// 15 минут тутамд cleanup ажиллуулах
function initLockCleanup() {
  // Серверийг эхлүүлэхэд нэг удаа ажиллуулах
  cleanupExpiredLocks();

  // 15 минут тутамд
  setInterval(cleanupExpiredLocks, 15 * 60 * 1000);
  
  console.log("[CLEANUP] Lock cleanup scheduler initialized (every 15 minutes)");
}

module.exports = { cleanupExpiredLocks, initLockCleanup };
