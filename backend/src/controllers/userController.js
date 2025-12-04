const Cargo = require("../models/cargoModel");
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

module.exports = { getProfile, listCargos, setDefaultCargo };
