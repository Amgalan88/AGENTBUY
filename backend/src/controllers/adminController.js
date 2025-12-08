const Cargo = require("../models/cargoModel");
const Order = require("../models/orderModel");
const AgentProfile = require("../models/agentProfileModel");
const Settings = require("../models/settingsModel");
const User = require("../models/userModel");
const CardRequest = require("../models/cardRequestModel");
const { assertTransition, ORDER_STATUS } = require("../services/orderStateService");
const { applyCardChange, onPaymentConfirmed } = require("../services/cardService");

async function listCargos(_req, res) {
  const cargos = await Cargo.find().sort({ createdAt: -1 });
  res.json(cargos);
}

async function createCargo(req, res) {
  try {
    const { name, description, siteUrl, logoUrl, contactPhone, supportedCities = [], isActive } = req.body;
    if (!name) return res.status(400).json({ message: "Нэр шаардлагатай" });
    const cargo = await Cargo.create({
      name,
      description,
      siteUrl,
      logoUrl,
      contactPhone,
      isActive: isActive !== false,
      supportedCities,
    });
    res.status(201).json(cargo);
  } catch (err) {
    console.error("createCargo error", err);
    res.status(500).json({ message: "Карго үүсгэхэд алдаа гарлаа" });
  }
}

async function updateCargoStatus(req, res) {
  try {
    const cargo = await Cargo.findById(req.params.id);
    if (!cargo) return res.status(404).json({ message: "Карго олдсонгүй" });
    if (typeof req.body.isActive === "boolean") cargo.isActive = req.body.isActive;
    if (req.body.name) cargo.name = req.body.name;
    await cargo.save();
    res.json(cargo);
  } catch (err) {
    console.error("updateCargoStatus error", err);
    res.status(500).json({ message: "Карго шинэчлэхэд алдаа гарлаа" });
  }
}

async function deleteCargo(req, res) {
  try {
    const cargo = await Cargo.findById(req.params.id);
    if (!cargo) return res.status(404).json({ message: "Карго олдсонгүй" });
    await cargo.deleteOne();
    res.status(204).end();
  } catch (err) {
    console.error("deleteCargo error", err);
    res.status(500).json({ message: "Карго устгахад алдаа гарлаа" });
  }
}

async function listOrders(_req, res) {
  const orders = await Order.find().populate("cargoId").sort({ createdAt: -1 }).limit(200);
  res.json(orders);
}

async function confirmPayment(req, res) {
  try {
    const order = await Order.findById(req.params.id).populate("userId");
    if (!order) return res.status(404).json({ message: "Захиалга олдсонгүй" });

    assertTransition(order.status, ORDER_STATUS.PAYMENT_CONFIRMED, "admin");

    order.status = ORDER_STATUS.PAYMENT_CONFIRMED;
    order.payment = order.payment || {};
    order.payment.status = "confirmed";
    order.payment.paidAt = order.payment.paidAt || new Date();
    if (req.body?.amountMnt) {
      order.payment.amountMnt = req.body.amountMnt;
    } else if (order.report?.pricing?.grandTotalCny) {
      const settings = await Settings.findOne({ key: "default" });
      if (settings?.cnyRate) {
        order.payment.amountMnt = Math.round(order.report.pricing.grandTotalCny * settings.cnyRate);
      }
    }

    await order.save();

    // Карт буцаан олгох логик: Амжилттай захиалга = карт буцаалт + 2 удаа бол бонус
    if (order.userId) {
      try {
        await onPaymentConfirmed(order.userId, order._id);
      } catch (cardErr) {
        console.error("Card reward error:", cardErr);
        // Карт олгох алдаа гарвал захиалгын статус өөрчлөгдсөн тул алдааг log-лоод үргэлжлүүлнэ
      }
    }

    const populated = await Order.findById(order._id).populate("cargoId");
    res.json(populated);
  } catch (err) {
    console.error("confirmPayment error", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Төлбөр баталгаажуулахад алдаа гарлаа" });
  }
}

async function listAgents(_req, res) {
  const profiles = await AgentProfile.find().populate("userId");
  res.json(profiles);
}

async function verifyAgent(req, res) {
  try {
    const { status } = req.body; // verified / rejected
    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({ message: "status=verified|rejected байх ёстой" });
    }
    const profile = await AgentProfile.findOne({ userId: req.params.id });
    if (!profile) return res.status(404).json({ message: "Agent profile олдсонгүй" });
    profile.verificationStatus = status;
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error("verifyAgent error", err);
    res.status(500).json({ message: "Баталгаажуулахад алдаа гарлаа" });
  }
}

async function updateAgentActive(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.roles.includes("agent")) return res.status(404).json({ message: "Агент олдсонгүй" });
    if (typeof req.body.isActive === "boolean") {
      user.isActive = req.body.isActive;
      await user.save();
    }
    res.json({ id: user._id, isActive: user.isActive });
  } catch (err) {
    console.error("updateAgentActive error", err);
    res.status(500).json({ message: "Агент идэвх шинэчлэхэд алдаа гарлаа" });
  }
}

async function updateTracking(req, res) {
  try {
    const { code } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Захиалга олдсонгүй" });
    order.tracking = order.tracking || {};
    order.tracking.code = code || "";
    order.tracking.lastUpdatedAt = new Date();
    await order.save();
    const populated = await Order.findById(order._id).populate("cargoId");
    res.json(populated);
  } catch (err) {
    console.error("updateTracking error", err);
    res.status(500).json({ message: "Tracking код хадгалах үед алдаа гарлаа." });
  }
}

async function getSettings(_req, res) {
  const doc = await Settings.findOne({ key: "default" });
  res.json(doc || {});
}

async function updateSettings(req, res) {
  try {
    const { cnyRate, bankName, bankAccount, bankOwner } = req.body;
    const doc = await Settings.findOneAndUpdate(
      { key: "default" },
      { $set: { cnyRate, bankName, bankAccount, bankOwner, key: "default" } },
      { new: true, upsert: true }
    );
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
    const filter = {};
    if (status) filter.status = status;
    
    const requests = await CardRequest.find(filter)
      .populate("userId", "fullName phone")
      .populate("confirmedBy", "fullName")
      .sort({ createdAt: -1 })
      .limit(100);
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
    const request = await CardRequest.findById(req.params.id).populate("userId");
    if (!request) return res.status(404).json({ message: "Хүсэлт олдсонгүй" });
    
    if (request.status !== "pending") {
      return res.status(400).json({ message: "Энэ хүсэлт аль хэдийн боловсруулагдсан" });
    }

    // Карт нэмэх
    await applyCardChange(
      request.userId,
      request.quantity,
      "buy_package",
      null,
      { requestId: request._id, pricePerCard: request.pricePerCard, totalAmount: request.totalAmount }
    );

    // Хүсэлтийг баталгаажуулах
    request.status = "confirmed";
    request.confirmedBy = req.user._id;
    request.confirmedAt = new Date();
    await request.save();

    const populated = await CardRequest.findById(request._id)
      .populate("userId", "fullName phone")
      .populate("confirmedBy", "fullName");

    res.json(populated);
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
    const request = await CardRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Хүсэлт олдсонгүй" });
    
    if (request.status !== "pending") {
      return res.status(400).json({ message: "Энэ хүсэлт аль хэдийн боловсруулагдсан" });
    }

    request.status = "rejected";
    request.rejectedReason = reason || "Татгалзсан";
    request.confirmedBy = req.user._id;
    request.confirmedAt = new Date();
    await request.save();

    const populated = await CardRequest.findById(request._id)
      .populate("userId", "fullName phone")
      .populate("confirmedBy", "fullName");

    res.json(populated);
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
