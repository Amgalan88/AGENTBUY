const Order = require("../models/orderModel");
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
  const orders = await Order.find({
    status: ORDER_STATUS.PUBLISHED,
    "lock.lockedByAgentId": { $exists: false },
  })
    .populate("cargoId")
    .sort({ createdAt: -1 });
  res.json(orders);
}

async function getOrder(req, res) {
  const order = await Order.findById(req.params.id).populate("cargoId");
  if (!order) return res.status(404).json({ message: "Захиалга олдсонгүй" });
  const isMine = order.agentId?.equals(req.user._id);
  const isPublic = order.status === ORDER_STATUS.PUBLISHED;
  if (!isMine && !isPublic) {
    return res.status(403).json({ message: "Энэ захиалгад нэвтрэх эрхгүй" });
  }
  res.json(order);
}

async function listMyOrders(req, res) {
  const orders = await Order.find({ agentId: req.user._id }).populate("cargoId").sort({ createdAt: -1 });
  res.json(orders);
}

async function lockOrder(req, res) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Захиалга олдсонгүй" });

    assertTransition(order.status, ORDER_STATUS.AGENT_LOCKED, "agent");
    if (order.lock?.lockedByAgentId) {
      return res.status(400).json({ message: "Өөр агент түгжсэн байна" });
    }

    order.agentId = req.user._id;
    const now = new Date();
    const expires = new Date(now.getTime() + RESEARCH_LOCK_HOURS * 60 * 60 * 1000);
    order.lock = {
      lockedByAgentId: req.user._id,
      lockedAt: now,
      expiresAt: expires,
      extensionCount: 0,
    };
    order.status = ORDER_STATUS.AGENT_LOCKED;
    await order.save();

    try {
      getIO().emit("order:update", { orderId: order._id, status: order.status, lock: true });
    } catch (e) {}

    res.json(order);
  } catch (err) {
    console.error("lockOrder error", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Системийн алдаа" });
  }
}

async function startResearch(req, res) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Захиалга олдсонгүй" });
    if (!order.lock?.lockedByAgentId?.equals(req.user._id)) {
      return res.status(403).json({ message: "Түгжээгүй захиалга" });
    }
    assertTransition(order.status, ORDER_STATUS.AGENT_RESEARCHING, "agent");
    order.status = ORDER_STATUS.AGENT_RESEARCHING;
    await order.save();
    try {
      getIO().emit("order:update", { orderId: order._id, status: order.status });
    } catch (e) {}
    res.json(order);
  } catch (err) {
    console.error("startResearch error", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Системийн алдаа" });
  }
}

async function submitReport(req, res) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Захиалга олдсонгүй" });
    if (!order.lock?.lockedByAgentId?.equals(req.user._id)) {
      return res.status(403).json({ message: "Түгжээгүй захиалга" });
    }
    assertTransition(order.status, ORDER_STATUS.REPORT_SUBMITTED, "agent");

    const { items = [], pricing = {}, paymentLink } = req.body;
    
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
    
    order.report = {
      items: normalizedItems,
      pricing,
      paymentLink,
      submittedAt: new Date(),
    };
    order.status = ORDER_STATUS.WAITING_USER_REVIEW;
    await order.save();

    try {
      getIO().emit("order:update", { orderId: order._id, status: order.status });
    } catch (e) {}

    res.json(order);
  } catch (err) {
    console.error("submitReport error", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Системийн алдаа" });
  }
}

async function updateTracking(req, res) {
  try {
    const { code } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Захиалга олдсонгүй" });
    if (!order.agentId?.equals(req.user._id)) return res.status(403).json({ message: "Энэ захиалга таны биш" });
    if (!TRACK_ALLOWED.includes(order.status)) {
      return res.status(400).json({ 
        message: `Энэ төлөвт tracking оруулах боломжгүй. Төлөв: ${order.status}. Tracking оруулах боломжтой төлөвүүд: ${TRACK_ALLOWED.join(", ")}` 
      });
    }
    order.tracking = order.tracking || {};
    order.tracking.code = code || "";
    order.tracking.lastUpdatedAt = new Date();
    await order.save();
    const populated = await Order.findById(order._id).populate("cargoId");
    try {
      getIO().emit("order:update", { orderId: populated._id, status: populated.status, tracking: populated.tracking });
    } catch (e) {}
    res.json(populated);
  } catch (err) {
    console.error("agent updateTracking error", err);
    res.status(500).json({ message: "Tracking код хадгалах үед алдаа гарлаа." });
  }
}

async function addAgentComment(req, res) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Захиалга олдсонгүй" });
    if (!order.agentId?.equals(req.user._id)) {
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

    order.comments = order.comments || [];
    order.comments.push({
      senderId: req.user._id,
      senderRole: "agent",
      message: hasMessage ? message.trim() : "",
      attachments: uploadedAttachments,
    });
    await order.save();

    try {
      getIO().emit("order:comment", { orderId: order._id, role: "agent" });
    } catch (e) {}

    res.json(order);
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
  addAgentComment,
};
