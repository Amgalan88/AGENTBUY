const Cargo = require("../models/cargoModel");
const CardRequest = require("../models/cardRequestModel");
const Settings = require("../models/settingsModel");
const { safeUser } = require("./utils");

async function getProfile(req, res) {
  res.json(safeUser(req.user));
}

async function listCargos(req, res) {
  const cargos = await Cargo.find({ isActive: true }).sort({ createdAt: -1 });
  res.json(cargos);
}

async function setDefaultCargo(req, res) {
  try {
    const cargoId = req.body?.cargoId;
    if (!cargoId) return res.status(400).json({ message: "Карго сонгоно уу" });
    const cargo = await Cargo.findOne({ _id: cargoId, isActive: true });
    if (!cargo) return res.status(404).json({ message: "Карго олдсонгүй эсвэл идэвхгүй" });
    req.user.defaultCargoId = cargoId;
    await req.user.save();
    res.json(safeUser(req.user));
  } catch (err) {
    console.error("setDefaultCargo error", err);
    res.status(500).json({ message: "Тохиргоо хадгалахад алдаа гарлаа" });
  }
}

/**
 * Карт худалдан авах хүсэлт үүсгэх
 */
async function requestCards(req, res) {
  try {
    const { quantity, paymentProof } = req.body;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Картын тоо 1-ээс дээш байх ёстой" });
    }

    const PRICE_PER_CARD = 2000; // Карт бүрийн үнэ (MNT)
    const totalAmount = quantity * PRICE_PER_CARD;

    // Settings-аас дансны мэдээлэл авах
    const settings = await Settings.findOne({ key: "default" });

    // Хүсэлт үүсгэх
    const cardRequest = await CardRequest.create({
      userId: req.user._id,
      quantity,
      pricePerCard: PRICE_PER_CARD,
      totalAmount,
      paymentInfo: {
        bankName: settings?.bankName || "",
        bankAccount: settings?.bankAccount || "",
        bankOwner: settings?.bankOwner || "",
      },
      paymentProof: paymentProof || undefined,
      status: "pending",
    });

    res.status(201).json(cardRequest);
  } catch (err) {
    console.error("requestCards error", err);
    res.status(500).json({ message: "Карт худалдан авах хүсэлт үүсгэхэд алдаа гарлаа" });
  }
}

/**
 * Хэрэглэгчийн картын хүсэлтүүдийг авах
 */
async function getMyCardRequests(req, res) {
  try {
    const requests = await CardRequest.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(requests);
  } catch (err) {
    console.error("getMyCardRequests error", err);
    res.status(500).json({ message: "Картын хүсэлтүүдийг авахад алдаа гарлаа" });
  }
}

module.exports = { getProfile, listCargos, setDefaultCargo, requestCards, getMyCardRequests };
