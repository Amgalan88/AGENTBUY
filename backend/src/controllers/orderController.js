const Order = require("../models/orderModel");
const Cargo = require("../models/cargoModel");
const { assertTransition, ORDER_STATUS } = require("../services/orderStateService");
const { consumeOnPublish, returnOnCancel, completeBonus } = require("../services/cardService");
const { getIO } = require("../socket");
const { normalizeItemImages } = require("../services/cloudinaryService");

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

    const normalizedItems = await normalizeItemImages(items);

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
  const { status } = req.query;
  const filter = { userId: req.user._id };
  if (status) filter.status = status;
  const orders = await Order.find(filter).populate("cargoId").sort({ createdAt: -1 });
  res.json(orders);
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

    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Сэтгэгдэл хоосон байж болохгүй" });
    }

    order.comments = order.comments || [];
    order.comments.push({
      senderId: req.user._id,
      senderRole: "user",
      message: message.trim(),
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
};
