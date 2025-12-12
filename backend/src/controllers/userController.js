const { prisma } = require("../config/db");
const { safeUser } = require("./utils");

async function getProfile(req, res) {
  res.json(safeUser(req.user));
}

async function listCargos(req, res) {
  const cargos = await prisma.cargo.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(cargos);
}

async function setDefaultCargo(req, res) {
  try {
    const cargoId = req.body?.cargoId;
    if (!cargoId) return res.status(400).json({ message: "Карго сонгоно уу" });
    const cargo = await prisma.cargo.findFirst({
      where: { id: cargoId, isActive: true },
    });
    if (!cargo) return res.status(404).json({ message: "Карго олдсонгүй эсвэл идэвхгүй" });
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id || req.user._id },
      data: { defaultCargoId: cargoId },
    });
    res.json(safeUser(updatedUser));
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
    const { quantity, transactionNumber, paymentProof } = req.body;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Картын тоо 1-ээс дээш байх ёстой" });
    }

    if (!transactionNumber || transactionNumber.trim() === "") {
      return res.status(400).json({ message: "Гүйлгээний утга / Картын дугаар оруулна уу" });
    }

    const PRICE_PER_CARD = 2000; // Карт бүрийн үнэ (MNT)
    const totalAmount = quantity * PRICE_PER_CARD;

    // Settings-аас дансны мэдээлэл авах
    const settings = await prisma.settings.findUnique({ where: { key: "default" } });

    // Хүсэлт үүсгэх
    const cardRequest = await prisma.cardRequest.create({
      data: {
        userId: req.user.id || req.user._id,
        quantity,
        pricePerCard: PRICE_PER_CARD,
        totalAmount,
        transactionNumber: transactionNumber?.trim() || "",
        paymentProof: paymentProof || undefined,
        status: "pending",
        paymentInfo: {
          create: {
            bankName: settings?.bankName || "",
            bankAccount: settings?.bankAccount || "",
            bankOwner: settings?.bankOwner || "",
          },
        },
      },
      include: {
        paymentInfo: true,
      },
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
    const requests = await prisma.cardRequest.findMany({
      where: { userId: req.user.id || req.user._id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        paymentInfo: true,
      },
    });
    res.json(requests);
  } catch (err) {
    console.error("getMyCardRequests error", err);
    res.status(500).json({ message: "Картын хүсэлтүүдийг авахад алдаа гарлаа" });
  }
}

/**
 * Хэрэглэгчийн картын transaction-уудыг авах
 */
async function getMyCardTransactions(req, res) {
  try {
    const transactions = await prisma.cardTransaction.findMany({
      where: { userId: req.user.id || req.user._id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        order: {
          select: {
            id: true,
            status: true,
            items: true,
          },
        },
      },
    });
    res.json(transactions);
  } catch (err) {
    console.error("getMyCardTransactions error", err);
    res.status(500).json({ message: "Картын зарцуулалтыг авахад алдаа гарлаа" });
  }
}

module.exports = { getProfile, listCargos, setDefaultCargo, requestCards, getMyCardRequests, getMyCardTransactions };
