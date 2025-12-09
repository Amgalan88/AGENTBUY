const Order = require("../models/orderModel");
const Cargo = require("../models/cargoModel");
const { assertTransition, ORDER_STATUS } = require("../services/orderStateService");
const { consumeOnPublish, returnOnCancel, completeBonus } = require("../services/cardService");
const { getIO } = require("../socket");
const { normalizeItemImages, uploadImages } = require("../services/cloudinaryService");

const ERR_NOT_FOUND = { message: "Захиалга олдсонгүй" };

async function createDraft(req, res) {
  try {
    const { items = [], cargoId, isPackage = false, userNote } = req.body;
    if (!items.length) {
      return res.status(400).json({ message: "Дор хаяж 1 бараа оруулна уу" });
    }
    if (!cargoId) {
      return res.status(400).json({ message: "Карго сонгоно уу" });
    }
    const cargo = await Cargo.findById(cargoId);
    if (!cargo) {
      return res.status(400).json({ message: "Карго олдсонгүй" });
    }

    // Cloudinary-д зураг upload хийх (base64 string-уудыг URL болгох)
    const normalizedItems = await normalizeItemImages(items);
    // normalizeItemImages алдаа гарвал null эсвэл алдаа throw хийх
    // Энэ нь зөвхөн Cloudinary URL-уудыг буцаана, base64 string-уудыг filter хийж байна

    const order = await Order.create({
      userId: req.user._id,
      cargoId,
      isPackage,
      items: normalizedItems,
      userNote,
      status: ORDER_STATUS.DRAFT,
    });

    res.status(201).json(order);
  } catch (err) {
    console.error("createDraft error", err);
    res.status(500).json({ message: "Серверийн алдаа" });
  }
}

async function publishOrder(req, res) {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) return res.status(404).json(ERR_NOT_FOUND);

    assertTransition(order.status, ORDER_STATUS.PUBLISHED, "user");

    await consumeOnPublish(req.user, order._id, order);
    order.status = ORDER_STATUS.PUBLISHED;
    await order.save();

    try {
      getIO().emit("order:new", { orderId: order._id, status: order.status });
    } catch (e) {}

    res.json(order);
  } catch (err) {
    console.error("publishOrder error", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Серверийн алдаа" });
  }
}

async function listUserOrders(req, res) {
  const { status, limit = 50 } = req.query;
  const filter = { userId: req.user._id };
  if (status) filter.status = status;
  const orders = await Order.find(filter)
    .populate("cargoId", "name")
    .sort({ createdAt: -1 })
    .limit(Number(limit));
  
  // Base64 string-уудыг filter хийх (зөвхөн Cloudinary URL-уудыг буцаах)
  const filteredOrders = orders.map(order => {
    const filteredItems = (order.items || []).map(item => {
      if (item.images && Array.isArray(item.images)) {
        // Base64 string-уудыг filter хийх
        const filteredImages = item.images.filter(img => 
          img && 
          typeof img === "string" && 
          !img.startsWith("data:") &&
          (img.startsWith("http://") || img.startsWith("https://"))
        );
        return { ...item.toObject(), images: filteredImages };
      }
      return item.toObject();
    });
    return { ...order.toObject(), items: filteredItems };
  });
  
  res.json(filteredOrders);
}

async function getOrderDetail(req, res) {
  const order = await Order.findOne({ _id: req.params.id, userId: req.user._id }).populate("cargoId");
  if (!order) return res.status(404).json(ERR_NOT_FOUND);
  res.json(order);
}

async function cancelBeforeAgent(req, res) {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) return res.status(404).json(ERR_NOT_FOUND);

    if (order.lock?.lockedByAgentId) {
      return res.status(400).json({ message: "Агент түгжсэн учраас цуцлах боломжгүй" });
    }
    assertTransition(order.status, ORDER_STATUS.CANCELLED_BY_USER, "user");

    await returnOnCancel(req.user, order._id);
    order.status = ORDER_STATUS.CANCELLED_BY_USER;
    await order.save();

    const populated = await Order.findById(order._id).populate("cargoId");
    try {
      getIO().emit("order:update", { 
        orderId: order._id.toString(),
        status: order.status,
        order: populated.toObject ? populated.toObject() : populated
      });
    } catch (e) {}

    res.json(order);
  } catch (err) {
    console.error("cancelBeforeAgent error", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Серверийн алдаа" });
  }
}

async function cancelAfterReport(req, res) {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) return res.status(404).json(ERR_NOT_FOUND);
    assertTransition(order.status, ORDER_STATUS.USER_REJECTED, "user");

    order.status = ORDER_STATUS.USER_REJECTED;
    await order.save();

    try {
      getIO().emit("order:update", { orderId: order._id, status: order.status });
    } catch (e) {}
    res.json(order);
  } catch (err) {
    console.error("cancelAfterReport error", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Серверийн алдаа" });
  }
}

async function acceptReport(req, res) {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) return res.status(404).json(ERR_NOT_FOUND);
    assertTransition(order.status, ORDER_STATUS.WAITING_PAYMENT, "user");

    order.status = ORDER_STATUS.WAITING_PAYMENT;
    order.payment = order.payment || {};
    order.payment.deadline = order.payment.deadline || new Date(Date.now() + 1000 * 60 * 60 * 24);
    await order.save();

    try {
      getIO().emit("order:update", { orderId: order._id, status: order.status });
    } catch (e) {}

    res.json(order);
  } catch (err) {
    console.error("acceptReport error", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Серверийн алдаа" });
  }
}

async function confirmCompleted(req, res) {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) return res.status(404).json(ERR_NOT_FOUND);
    assertTransition(order.status, ORDER_STATUS.COMPLETED, "user");

    order.status = ORDER_STATUS.COMPLETED;
    await order.save();
    await completeBonus(req.user, order._id);

    try {
      getIO().emit("order:update", { orderId: order._id, status: order.status });
    } catch (e) {}

    res.json(order);
  } catch (err) {
    console.error("confirmCompleted error", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Серверийн алдаа" });
  }
}

async function addComment(req, res) {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) return res.status(404).json(ERR_NOT_FOUND);

    const { message, attachments = [] } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Сэтгэгдэл хоосон байж болохгүй" });
    }

    // Зурагнуудыг Cloudinary-д upload хийх
    let uploadedAttachments = [];
    if (Array.isArray(attachments) && attachments.length > 0) {
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
      senderRole: "user",
      message: message.trim(),
      attachments: uploadedAttachments,
    });
    await order.save();

    try {
      getIO().emit("order:comment", { orderId: order._id, role: "user" });
    } catch (e) {}

    res.json(order);
  } catch (err) {
    console.error("addComment error", err);
    res.status(500).json({ message: "Серверийн алдаа" });
  }
}

async function updateOrderName(req, res) {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) return res.status(404).json(ERR_NOT_FOUND);

    const { customName } = req.body;
    order.customName = customName ? customName.trim() : null;
    await order.save();

    try {
      getIO().emit("order:update", { orderId: order._id, order });
    } catch (e) {}

    res.json(order);
  } catch (err) {
    console.error("updateOrderName error", err);
    res.status(500).json({ message: "Серверийн алдаа" });
  }
}

async function updateDraft(req, res) {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) return res.status(404).json(ERR_NOT_FOUND);

    // Зөвхөн ноорог захиалгыг засах боломжтой
    if (order.status !== ORDER_STATUS.DRAFT) {
      return res.status(400).json({ message: "Зөвхөн ноорог захиалгыг засах боломжтой" });
    }

    const { items, cargoId, userNote } = req.body;
    
    if (items && Array.isArray(items) && items.length > 0) {
      // Cloudinary-д зураг upload хийх (зөвхөн Cloudinary URL-уудыг хадгалах)
      const normalizedItems = await normalizeItemImages(items);
      order.items = normalizedItems;
    }

    if (cargoId) {
      const cargo = await Cargo.findById(cargoId);
      if (!cargo) {
        return res.status(400).json({ message: "Карго олдсонгүй" });
      }
      order.cargoId = cargoId;
    }

    if (userNote !== undefined) {
      order.userNote = userNote ? userNote.trim() : null;
    }

    await order.save();

    try {
      getIO().emit("order:update", { orderId: order._id, order });
    } catch (e) {}

    res.json(order);
  } catch (err) {
    console.error("updateDraft error", err);
    res.status(500).json({ message: "Серверийн алдаа" });
  }
}

async function deleteOrder(req, res) {
  try {
    console.log("[Delete] Received delete request for order:", req.params.id, "from user:", req.user._id);
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) {
      console.log("[Delete] Order not found:", req.params.id);
      return res.status(404).json(ERR_NOT_FOUND);
    }

    console.log("[Delete] Order found, status:", order.status);

    // Зөвхөн цуцлагдсан статустай захиалгуудыг устгах боломжтой (PUBLISHED-ийг цуцлаад дараа нь устгана)
    const deletableStatuses = [
      ORDER_STATUS.CANCELLED_BY_USER,
      ORDER_STATUS.CANCELLED_BY_ADMIN,
      ORDER_STATUS.CANCELLED_NO_AGENT,
      ORDER_STATUS.USER_REJECTED,
      ORDER_STATUS.PAYMENT_EXPIRED,
    ];

    if (!deletableStatuses.includes(order.status)) {
      console.log("[Delete] Status not deletable:", order.status);
      return res.status(400).json({
        message: `Энэ захиалгыг устгах боломжгүй. Зөвхөн нээлттэй эсвэл цуцлагдсан захиалгуудыг устгах боломжтой.`,
      });
    }

    // Захиалгыг MongoDB-аас бүрэн устгах
    console.log("[Delete] Deleting order from database...");
    await Order.findByIdAndDelete(order._id);
    console.log("[Delete] Order deleted successfully");

    try {
      getIO().emit("order:delete", { orderId: order._id });
      console.log("[Delete] Socket event emitted");
    } catch (e) {
      console.error("Socket emit error:", e);
    }

    res.status(204).send();
  } catch (err) {
    console.error("deleteOrder error", err);
    res.status(500).json({ message: "Серверийн алдаа" });
  }
}

module.exports = {
  createDraft,
  publishOrder,
  listUserOrders,
  getOrderDetail,
  cancelBeforeAgent,
  cancelAfterReport,
  acceptReport,
  confirmCompleted,
  addComment,
  updateOrderName,
  updateDraft,
  deleteOrder,
};
