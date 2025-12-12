const bcrypt = require("bcryptjs");
const { prisma } = require("../config/db");
const { ROLES } = require("../constants/roles");

async function ensureBaseCargo() {
  const count = await prisma.cargo.count();
  if (count > 0) return;
  await prisma.cargo.create({
    data: {
      name: "Default Cargo",
      description: "Анхны туршилтын карго",
      siteUrl: "",
      contactPhone: "",
      supportedCities: ["Ulaanbaatar"],
    },
  });
  console.log("Seeded default cargo");
}

async function ensureAdmin() {
  const phone = "Amgalanbai";
  const exists = await prisma.user.findUnique({ where: { phone } });
  if (exists) return;
  const passwordHash = await bcrypt.hash("Amgalan0708", 10);
  await prisma.user.create({
    data: {
      phone,
      fullName: "Амгалан Админ",
      passwordHash,
      roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
      secretQuestion: "Ээжийнхээ нэр юу вэ?",
      secretAnswerHash: await bcrypt.hash("admin", 10),
      cardBalance: 0,
      cardProgress: 0,
    },
  });
  console.log("Seeded default admin user");
}

module.exports = { ensureBaseCargo, ensureAdmin };
