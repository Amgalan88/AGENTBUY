const bcrypt = require("bcryptjs");
const Cargo = require("../models/cargoModel");
const User = require("../models/userModel");
const { ROLES } = require("../constants/roles");

async function ensureBaseCargo() {
  const count = await Cargo.countDocuments();
  if (count > 0) return;
  await Cargo.create({
    name: "Default Cargo",
    description: "Анхны туршилтын карго",
    siteUrl: "",
    contactPhone: "",
    supportedCities: ["Ulaanbaatar"],
  });
  console.log("Seeded default cargo");
}

async function ensureAdmin() {
  const phone = "Amgalanbai";
  const exists = await User.findOne({ phone });
  if (exists) return;
  const passwordHash = await bcrypt.hash("Amgalan0708", 10);
  await User.create({
    phone,
    fullName: "Амгалан Админ",
    passwordHash,
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    secretQuestion: "Ээжийнхээ нэр юу вэ?",
    secretAnswerHash: await bcrypt.hash("admin", 10),
    cardBalance: 0,
    cardProgress: 0,
  });
  console.log("Seeded default admin user");
}

module.exports = { ensureBaseCargo, ensureAdmin };
