const { prisma } = require("../config/db");
const { assertTransition, ORDER_STATUS } = require("../services/orderStateService");
const { applyCardChange, onPaymentConfirmed } = require("../services/cardService");
const { getIO } = require("../socket");

async function listCargos(_req, res) {
  const cargos = await prisma.cargo.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(cargos);
}

async function createCargo(req, res) {
  try {
    const { name, description, siteUrl, logoUrl, contactPhone, supportedCities = [], isActive } = req.body;
    if (!name) return res.status(400).json({ message: "Нэр шаардлагатай" });
    const cargo = await prisma.cargo.create({
      data: {
        name,
        description,
        siteUrl,
        logoUrl,
        contactPhone,
        isActive: isActive !== false,
        supportedCities,
      },
    });
    res.status(201).json(cargo);
  } catch (err) {
    console.error("createCargo error", err);
    res.status(500).json({ message: "Карго үүсгэхэд алдаа гарлаа" });
  }
}

async function updateCargoStatus(req, res) {
  try {
    const cargo = await prisma.cargo.findUnique({ where: { id: req.params.id } });
    if (!cargo) return res.status(404).json({ message: "Карго олдсонгүй" });
    const updateData = {};
    if (typeof req.body.isActive === "boolean") updateData.isActive = req.body.isActive;
    if (req.body.name) updateData.name = req.body.name;
    const updatedCargo = await prisma.cargo.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json(updatedCargo);
  } catch (err) {
    console.error("updateCargoStatus error", err);
    res.status(500).json({ message: "Карго шинэчлэхэд алдаа гарлаа" });
  }
}

async function deleteCargo(req, res) {
  try {
    const cargo = await prisma.cargo.findUnique({ where: { id: req.params.id } });
    if (!cargo) return res.status(404).json({ message: "Карго олдсонгүй" });
    await prisma.cargo.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    console.error("deleteCargo error", err);
    res.status(500).json({ message: "Карго устгахад алдаа гарлаа" });
  }
}

async function listOrders(_req, res) {
  const orders = await prisma.order.findMany({
    include: {
      cargo: true,
      items: true,
      user: {
        select: { id: true, fullName: true, phone: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json(orders);
}

async function confirmPayment(req, res) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        report: {
          include: {
            pricing: true,
          },
        },
        payment: true,
      },
    });
    if (!order) return res.status(404).json({ message: "Захиалга олдсонгүй" });

    assertTransition(order.status, ORDER_STATUS.PAYMENT_CONFIRMED, "admin");

    let amountMnt = req.body?.amountMnt;
    if (!amountMnt && order.report?.pricing?.grandTotalCny) {
      const settings = await prisma.settings.findUnique({ where: { key: "default" } });
      if (settings?.cnyRate) {
        amountMnt = Math.round(order.report.pricing.grandTotalCny * settings.cnyRate);
      }
    }

    // Payment үүсгэх эсвэл шинэчлэх
    if (order.payment) {
      await prisma.orderPayment.update({
        where: { orderId: order.id },
        data: {
          status: "confirmed",
          paidAt: order.payment.paidAt || new Date(),
          amountMnt: amountMnt || order.payment.amountMnt,
        },
      });
    } else {
      await prisma.orderPayment.create({
        data: {
          orderId: order.id,
          status: "confirmed",
          paidAt: new Date(),
          amountMnt: amountMnt || null,
        },
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: ORDER_STATUS.PAYMENT_CONFIRMED },
      include: {
        cargo: true,
        items: true,
        payment: true,
      },
    });

    // Карт буцаан олгох логик: Амжилттай захиалга = карт буцаалт + 2 удаа бол бонус
    if (order.userId) {
      try {
        await onPaymentConfirmed(order.user, order.id);
        // Socket event илгээх - хэрэглэгчид мэдэгдэх
        const updatedUser = await prisma.user.findUnique({ where: { id: order.userId } });
        try {
          getIO().emit("card:balance:update", { 
            userId: order.userId,
            cardBalance: updatedUser.cardBalance 
          });
        } catch (e) {
          console.error("Socket emit error:", e);
        }
      } catch (cardErr) {
        console.error("Card reward error:", cardErr);
        // Карт олгох алдаа гарвал захиалгын статус өөрчлөгдсөн тул алдааг log-лоод үргэлжлүүлнэ
      }
    }

    // Socket event илгээх - захиалгын статус өөрчлөгдсөнийг мэдэгдэх
    try {
      getIO().emit("order:update", { 
        orderId: order.id,
        status: updatedOrder.status,
        order: updatedOrder,
      });
    } catch (e) {
      console.error("Socket emit error:", e);
    }
    
    res.json(updatedOrder);
  } catch (err) {
    console.error("confirmPayment error", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Төлбөр баталгаажуулахад алдаа гарлаа" });
  }
}

async function listAgents(_req, res) {
  const profiles = await prisma.agentProfile.findMany({
    include: {
      user: {
        select: { id: true, fullName: true, phone: true, email: true, isActive: true },
      },
    },
  });
  res.json(profiles);
}

async function verifyAgent(req, res) {
  try {
    const { status } = req.body; // verified / rejected
    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({ message: "status=verified|rejected байх ёстой" });
    }
    const profile = await prisma.agentProfile.findUnique({ where: { userId: req.params.id } });
    if (!profile) return res.status(404).json({ message: "Agent profile олдсонгүй" });
    const updatedProfile = await prisma.agentProfile.update({
      where: { userId: req.params.id },
      data: { verificationStatus: status },
      include: {
        user: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
      },
    });
    res.json(updatedProfile);
  } catch (err) {
    console.error("verifyAgent error", err);
    res.status(500).json({ message: "Баталгаажуулахад алдаа гарлаа" });
  }
}

async function updateAgentActive(req, res) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user || !user.roles.includes("agent")) return res.status(404).json({ message: "Агент олдсонгүй" });
    if (typeof req.body.isActive === "boolean") {
      const updatedUser = await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive: req.body.isActive },
      });
      res.json({ id: updatedUser.id, isActive: updatedUser.isActive });
    } else {
      res.json({ id: user.id, isActive: user.isActive });
    }
  } catch (err) {
    console.error("updateAgentActive error", err);
    res.status(500).json({ message: "Агент идэвх шинэчлэхэд алдаа гарлаа" });
  }
}

async function updateTracking(req, res) {
  try {
    const { code, carrierName, lastStatus } = req.body;
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { tracking: true },
    });
    if (!order) return res.status(404).json({ message: "Захиалга олдсонгүй" });
    
    if (order.tracking) {
      await prisma.orderTracking.update({
        where: { orderId: order.id },
        data: {
          code: code || "",
          carrierName: carrierName || null,
          lastStatus: lastStatus || null,
          lastUpdatedAt: new Date(),
        },
      });
    } else {
      await prisma.orderTracking.create({
        data: {
          orderId: order.id,
          code: code || "",
          carrierName: carrierName || null,
          lastStatus: lastStatus || null,
          lastUpdatedAt: new Date(),
        },
      });
    }
    
    const populated = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        cargo: true,
        tracking: true,
        items: true,
      },
    });
    res.json(populated);
  } catch (err) {
    console.error("updateTracking error", err);
    res.status(500).json({ message: "Tracking код хадгалах үед алдаа гарлаа." });
  }
}

async function getSettings(_req, res) {
  const doc = await prisma.settings.findUnique({ where: { key: "default" } });
  res.json(doc || {});
}

async function updateSettings(req, res) {
  try {
    const { cnyRate, bankName, bankAccount, bankOwner } = req.body;
    const doc = await prisma.settings.upsert({
      where: { key: "default" },
      update: { cnyRate, bankName, bankAccount, bankOwner },
      create: { key: "default", cnyRate, bankName, bankAccount, bankOwner },
    });
    res.json(doc);
  } catch (err) {
    console.error("updateSettings error", err);
    res.status(500).json({ message: "Тохиргоо хадгалахад алдаа гарлаа" });
  }
}

/**
 * Картын хүсэлтүүдийг жагсаах
 */
async function listCardRequests(_req, res) {
  try {
    const { status } = _req.query;
    const where = {};
    if (status) where.status = status;
    
    const requests = await prisma.cardRequest.findMany({
      where,
      include: {
        user: {
          select: { id: true, fullName: true, phone: true },
        },
        confirmedBy: {
          select: { id: true, fullName: true },
        },
        paymentInfo: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json(requests);
  } catch (err) {
    console.error("listCardRequests error", err);
    res.status(500).json({ message: "Картын хүсэлтүүдийг авахад алдаа гарлаа" });
  }
}

/**
 * Картын хүсэлтийг баталгаажуулах (карт нэмэх)
 */
async function confirmCardRequest(req, res) {
  try {
    const request = await prisma.cardRequest.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        paymentInfo: true,
      },
    });
    if (!request) return res.status(404).json({ message: "Хүсэлт олдсонгүй" });
    
    if (request.status !== "pending") {
      return res.status(400).json({ message: "Энэ хүсэлт аль хэдийн боловсруулагдсан" });
    }

    // Карт нэмэх
    await applyCardChange(
      request.user,
      request.quantity,
      "buy_package",
      null,
      { requestId: request.id, pricePerCard: request.pricePerCard, totalAmount: request.totalAmount }
    );

    // Хүсэлтийг баталгаажуулах
    const userId = req.user.id || req.user._id;
    const updatedRequest = await prisma.cardRequest.update({
      where: { id: request.id },
      data: {
        status: "confirmed",
        confirmedByUserId: userId,
        confirmedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, fullName: true, phone: true },
        },
        confirmedBy: {
          select: { id: true, fullName: true },
        },
        paymentInfo: true,
      },
    });

    // Socket event илгээх - хэрэглэгчид мэдэгдэх
    try {
      const updatedUser = await prisma.user.findUnique({ where: { id: request.userId } });
      getIO().emit("card:balance:update", { 
        userId: request.userId,
        cardBalance: updatedUser.cardBalance 
      });
    } catch (e) {
      console.error("Socket emit error:", e);
    }

    res.json(updatedRequest);
  } catch (err) {
    console.error("confirmCardRequest error", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Картын хүсэлт баталгаажуулахад алдаа гарлаа" });
  }
}

/**
 * Картын хүсэлтийг татгалзах
 */
async function rejectCardRequest(req, res) {
  try {
    const { reason } = req.body;
    const request = await prisma.cardRequest.findUnique({
      where: { id: req.params.id },
    });
    if (!request) return res.status(404).json({ message: "Хүсэлт олдсонгүй" });
    
    if (request.status !== "pending") {
      return res.status(400).json({ message: "Энэ хүсэлт аль хэдийн боловсруулагдсан" });
    }

    const userId = req.user.id || req.user._id;
    const updatedRequest = await prisma.cardRequest.update({
      where: { id: request.id },
      data: {
        status: "rejected",
        rejectedReason: reason || "Татгалзсан",
        confirmedByUserId: userId,
        confirmedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, fullName: true, phone: true },
        },
        confirmedBy: {
          select: { id: true, fullName: true },
        },
        paymentInfo: true,
      },
    });

    res.json(updatedRequest);
  } catch (err) {
    console.error("rejectCardRequest error", err);
    res.status(500).json({ message: "Картын хүсэлт татгалзахад алдаа гарлаа" });
  }
}

module.exports = {
  listCargos,
  createCargo,
  updateCargoStatus,
  deleteCargo,
  listOrders,
  verifyAgent,
  getSettings,
  updateSettings,
  confirmPayment,
  listAgents,
  updateAgentActive,
  updateTracking,
  listCardRequests,
  confirmCardRequest,
  rejectCardRequest,
};
