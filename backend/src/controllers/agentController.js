const { prisma } = require("../config/db");
const { assertTransition, ORDER_STATUS } = require("../services/orderStateService");
const { getIO } = require("../socket");
const { normalizeItemImages, uploadImages } = require("../services/cloudinaryService");

const RESEARCH_LOCK_HOURS = 2;
const TRACK_ALLOWED = [
  ORDER_STATUS.PAYMENT_CONFIRMED,
  ORDER_STATUS.ORDER_PLACED,
  ORDER_STATUS.CARGO_IN_TRANSIT,
  ORDER_STATUS.ARRIVED_AT_CARGO,
  ORDER_STATUS.COMPLETED,
];

async function listAvailable(_req, res) {
  const orders = await prisma.order.findMany({
    where: {
      status: ORDER_STATUS.PUBLISHED,
      lock: null,
    },
    include: {
      cargo: true,
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
}

async function getOrder(req, res) {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      cargo: true,
      items: true,
      lock: true,
      report: {
        include: {
          items: true,
          pricing: true,
        },
      },
    },
  });
  if (!order) return res.status(404).json({ message: "Захиалга олдсонгүй" });
  const userId = req.user.id || req.user._id;
  const isMine = order.agentId === userId;
  const isPublic = order.status === ORDER_STATUS.PUBLISHED;
  if (!isMine && !isPublic) {
    return res.status(403).json({ message: "Энэ захиалгад нэвтрэх эрхгүй" });
  }
  res.json(order);
}

async function listMyOrders(req, res) {
  const userId = req.user.id || req.user._id;
  const orders = await prisma.order.findMany({
    where: { agentId: userId },
    include: {
      cargo: true,
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
}

async function lockOrder(req, res) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { lock: true },
    });
    if (!order) return res.status(404).json({ message: "Захиалга олдсонгүй" });

    assertTransition(order.status, ORDER_STATUS.AGENT_LOCKED, "agent");
    if (order.lock?.lockedByAgentId) {
      return res.status(400).json({ message: "Өөр агент түгжсэн байна" });
    }

    const userId = req.user.id || req.user._id;
    const now = new Date();
    const expires = new Date(now.getTime() + RESEARCH_LOCK_HOURS * 60 * 60 * 1000);
    
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        agentId: userId,
        status: ORDER_STATUS.AGENT_LOCKED,
        lock: {
          create: {
            lockedByAgentId: userId,
            lockedAt: now,
            expiresAt: expires,
            extensionCount: 0,
          },
        },
      },
      include: {
        lock: true,
        cargo: true,
        items: true,
      },
    });

    try {
      getIO().emit("order:update", { orderId: order.id, status: updatedOrder.status, lock: true });
    } catch (e) {}

    res.json(updatedOrder);
  } catch (err) {
    console.error("lockOrder error", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Системийн алдаа" });
  }
}

async function startResearch(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { lock: true },
    });
    if (!order) return res.status(404).json({ message: "Захиалга олдсонгүй" });
    if (order.lock?.lockedByAgentId !== userId) {
      return res.status(403).json({ message: "Түгжээгүй захиалга" });
    }
    assertTransition(order.status, ORDER_STATUS.AGENT_RESEARCHING, "agent");
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: ORDER_STATUS.AGENT_RESEARCHING },
      include: { items: true, cargo: true },
    });
    try {
      getIO().emit("order:update", { orderId: order.id, status: updatedOrder.status });
    } catch (e) {}
    res.json(updatedOrder);
  } catch (err) {
    console.error("startResearch error", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Системийн алдаа" });
  }
}

async function submitReport(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { lock: true, report: true },
    });
    if (!order) return res.status(404).json({ message: "Захиалга олдсонгүй" });
    if (order.lock?.lockedByAgentId !== userId) {
      return res.status(403).json({ message: "Түгжээгүй захиалга" });
    }
    assertTransition(order.status, ORDER_STATUS.REPORT_SUBMITTED, "agent");

    const { items = [], pricing = {}, paymentLink, agentComment } = req.body;
    
    // Зурагнуудыг Cloudinary-д upload хийх (base64 string-уудыг URL болгох)
    let normalizedItems;
    try {
      normalizedItems = await normalizeItemImages(items, { folder: "agentbuy/reports" });
    } catch (err) {
      console.error("submitReport: normalizeItemImages error", err);
      return res.status(500).json({ message: "Зургуудыг upload хийхэд алдаа гарлаа. Дахин оролдоно уу." });
    }
    
    // Base64 string үлдсэн эсэхийг шалгах (зөвхөн URL байх ёстой)
    const hasBase64 = normalizedItems.some(item => {
      if (Array.isArray(item.images)) {
        return item.images.some(img => typeof img === "string" && img.startsWith("data:image"));
      }
      if (item.imageUrl && typeof item.imageUrl === "string") {
        return item.imageUrl.startsWith("data:image");
      }
      return false;
    });
    
    if (hasBase64) {
      console.error("submitReport: Base64 string үлдсэн байна");
      return res.status(500).json({ message: "Зургуудыг upload хийхэд алдаа гарлаа. Дахин оролдоно уу." });
    }
    
    // Report үүсгэх эсвэл шинэчлэх
    if (order.report) {
      // Хуучин report items болон pricing-ийг устгах
      await prisma.orderReportItem.deleteMany({ where: { reportId: order.report.id } });
      if (order.report.pricing) {
        await prisma.orderReportPricing.delete({ where: { reportId: order.report.id } });
      }
      
      // Report шинэчлэх
      await prisma.orderReport.update({
        where: { id: order.report.id },
        data: {
          paymentLink,
          agentComment,
          submittedAt: new Date(),
          items: {
            create: normalizedItems.map(item => ({
              title: item.title,
              imageUrl: item.imageUrl,
              sourceUrl: item.sourceUrl,
              quantity: item.quantity,
              agentPrice: item.agentPrice,
              agentCurrency: item.agentCurrency || "CNY",
              agentTotal: item.agentTotal,
              note: item.note,
              images: item.images || [],
              trackingCode: item.trackingCode,
            })),
          },
          pricing: {
            create: {
              productTotalCny: pricing.productTotalCny,
              domesticShippingCny: pricing.domesticShippingCny,
              serviceFeeCny: pricing.serviceFeeCny,
              otherFeesCny: pricing.otherFeesCny,
              grandTotalCny: pricing.grandTotalCny,
              exchangeRate: pricing.exchangeRate,
              grandTotalMnt: pricing.grandTotalMnt,
            },
          },
        },
      });
    } else {
      // Шинэ report үүсгэх
      await prisma.orderReport.create({
        data: {
          orderId: order.id,
          paymentLink,
          agentComment,
          submittedAt: new Date(),
          items: {
            create: normalizedItems.map(item => ({
              title: item.title,
              imageUrl: item.imageUrl,
              sourceUrl: item.sourceUrl,
              quantity: item.quantity,
              agentPrice: item.agentPrice,
              agentCurrency: item.agentCurrency || "CNY",
              agentTotal: item.agentTotal,
              note: item.note,
              images: item.images || [],
              trackingCode: item.trackingCode,
            })),
          },
          pricing: {
            create: {
              productTotalCny: pricing.productTotalCny,
              domesticShippingCny: pricing.domesticShippingCny,
              serviceFeeCny: pricing.serviceFeeCny,
              otherFeesCny: pricing.otherFeesCny,
              grandTotalCny: pricing.grandTotalCny,
              exchangeRate: pricing.exchangeRate,
              grandTotalMnt: pricing.grandTotalMnt,
            },
          },
        },
      });
    }
    
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: ORDER_STATUS.WAITING_USER_REVIEW },
      include: {
        report: {
          include: {
            items: true,
            pricing: true,
          },
        },
        items: true,
        cargo: true,
      },
    });

    try {
      getIO().emit("order:update", { orderId: order.id, status: updatedOrder.status });
    } catch (e) {}

    res.json(updatedOrder);
  } catch (err) {
    console.error("submitReport error", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Системийн алдаа" });
  }
}

async function updateTracking(req, res) {
  try {
    const { code, carrierName, lastStatus } = req.body;
    const userId = req.user.id || req.user._id;
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { tracking: true },
    });
    if (!order) return res.status(404).json({ message: "Захиалга олдсонгүй" });
    if (order.agentId !== userId) return res.status(403).json({ message: "Энэ захиалга таны биш" });
    if (!TRACK_ALLOWED.includes(order.status)) {
      return res.status(400).json({ 
        message: `Энэ төлөвт tracking оруулах боломжгүй. Төлөв: ${order.status}. Tracking оруулах боломжтой төлөвүүд: ${TRACK_ALLOWED.join(", ")}` 
      });
    }
    
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
    
    try {
      getIO().emit("order:update", { orderId: order.id, status: populated.status, tracking: populated.tracking });
    } catch (e) {}
    res.json(populated);
  } catch (err) {
    console.error("agent updateTracking error", err);
    res.status(500).json({ message: "Tracking код хадгалах үед алдаа гарлаа." });
  }
}

async function updateItemTracking(req, res) {
  try {
    const { itemIndex, code } = req.body;
    const userId = req.user.id || req.user._id;
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        report: {
          include: {
            items: true,
          },
        },
      },
    });
    if (!order) return res.status(404).json({ message: "Захиалга олдсонгүй" });
    if (order.agentId !== userId) return res.status(403).json({ message: "Энэ захиалга таны биш" });
    if (!TRACK_ALLOWED.includes(order.status)) {
      return res.status(400).json({ 
        message: `Энэ төлөвт tracking оруулах боломжгүй. Төлөв: ${order.status}` 
      });
    }
    if (!order.report || !order.report.items || !Array.isArray(order.report.items)) {
      return res.status(400).json({ message: "Тайлан олдсонгүй" });
    }
    if (itemIndex < 0 || itemIndex >= order.report.items.length) {
      return res.status(400).json({ message: "Буруу барааны индекс" });
    }
    
    const reportItem = order.report.items[itemIndex];
    await prisma.orderReportItem.update({
      where: { id: reportItem.id },
      data: { trackingCode: code || "" },
    });
    
    const populated = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        cargo: true,
        report: {
          include: {
            items: true,
            pricing: true,
          },
        },
        items: true,
      },
    });
    
    try {
      getIO().emit("order:update", { orderId: order.id, status: populated.status });
    } catch (e) {}
    res.json(populated);
  } catch (err) {
    console.error("agent updateItemTracking error", err);
    res.status(500).json({ message: "Tracking код хадгалах үед алдаа гарлаа." });
  }
}

async function addAgentComment(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
    });
    if (!order) return res.status(404).json({ message: "Захиалга олдсонгүй" });
    if (order.agentId !== userId) {
      return res.status(403).json({ message: "Энэ захиалга таны биш" });
    }

    const { message = "", attachments = [] } = req.body;
    const hasMessage = message && message.trim();
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
    
    if (!hasMessage && !hasAttachments) {
      return res.status(400).json({ message: "Мессеж эсвэл зураг заавал оруулах ёстой" });
    }

    // Зурагнуудыг Cloudinary-д upload хийх
    let uploadedAttachments = [];
    if (hasAttachments) {
      try {
        uploadedAttachments = await uploadImages(attachments, { folder: "agentbuy/chat" });
      } catch (uploadErr) {
        console.error("Chat image upload error:", uploadErr);
        // Upload алдаа гарвал зөвхөн текст илгээх
      }
    }

    await prisma.orderComment.create({
      data: {
        orderId: order.id,
        senderId: userId,
        senderRole: "agent",
        message: hasMessage ? message.trim() : "",
        attachments: uploadedAttachments,
      },
    });

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        comments: {
          include: {
            sender: {
              select: { id: true, fullName: true, avatarUrl: true },
            },
          },
        },
        items: true,
        cargo: true,
      },
    });

    try {
      getIO().emit("order:comment", { orderId: order.id, role: "agent" });
    } catch (e) {}

    res.json(updatedOrder);
  } catch (err) {
    console.error("addAgentComment error", err);
    res.status(500).json({ message: "Серверийн алдаа" });
  }
}

module.exports = {
  listAvailable,
  getOrder,
  listMyOrders,
  lockOrder,
  startResearch,
  submitReport,
  updateTracking,
  updateItemTracking,
  addAgentComment,
};
