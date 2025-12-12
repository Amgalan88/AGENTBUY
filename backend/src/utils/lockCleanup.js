const { prisma } = require("../config/db");
const { ORDER_STATUS } = require("../constants/orderStatus");

// Хугацаа дууссан lock-уудыг цэвэрлэх
async function cleanupExpiredLocks() {
  try {
    const now = new Date();
    
    // Хугацаа дууссан lock-тай захиалгуудыг олох
    const expiredLocks = await prisma.orderLock.findMany({
      where: {
        expiresAt: { lt: now },
        order: {
          status: { in: [ORDER_STATUS.AGENT_LOCKED, ORDER_STATUS.AGENT_RESEARCHING] },
        },
      },
      include: { order: true },
    });

    if (expiredLocks.length > 0) {
      // Lock-уудыг устгах, захиалгын статусыг шинэчлэх
      for (const lock of expiredLocks) {
        await prisma.$transaction([
          prisma.orderLock.delete({ where: { id: lock.id } }),
          prisma.order.update({
            where: { id: lock.orderId },
            data: {
              status: ORDER_STATUS.PUBLISHED,
              agentId: null,
            },
          }),
        ]);
      }
      
      console.log(`[CLEANUP] ${expiredLocks.length} expired locks released at ${now.toISOString()}`);
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
