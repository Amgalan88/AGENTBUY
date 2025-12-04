const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const CardTransaction = require("../models/cardTransactionModel");
const { ROLES } = require("../constants/roles");
const { safeUser } = require("./utils");
const { applyCardChange } = require("../services/cardService");

const DEFAULT_TOKEN_AGE = 60 * 60 * 24 * 7; // 7 хоног
const REMEMBER_TOKEN_AGE = 60 * 60 * 24 * 30; // 30 хоног

async function register(req, res) {
  try {
    const { phone, email, password, fullName, role } = req.body;

    if (!phone || !password || !fullName) {
      return res.status(400).json({ message: "Утас, нууц үг, нэр заавал шаардлагатай" });
    }

    const exists = await User.findOne({ phone });
    if (exists) {
      return res.status(400).json({ message: "Энэ утсаар бүртгэлтэй байна" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const roles = [role].filter((r) => [ROLES.USER, ROLES.AGENT].includes(r));
    const user = await User.create({
      phone,
      email,
      passwordHash,
      fullName,
      roles: roles.length ? roles : [ROLES.USER],
      cardBalance: 5,
      cardProgress: 0,
    });

    await CardTransaction.create({
      userId: user._id,
      type: "init",
      cardChange: 5,
      balanceAfter: 5,
      meta: { source: "signup" },
    });

    // агент болбол профайл үүсгэнэ
    if (roles.includes(ROLES.AGENT)) {
      const AgentProfile = require("../models/agentProfileModel");
      await AgentProfile.create({
        userId: user._id,
        verificationStatus: "pending",
      });
    }

    const token = signToken(user, DEFAULT_TOKEN_AGE);
    setAuthCookie(res, token, DEFAULT_TOKEN_AGE);
    res.status(201).json(safeUser(user));
  } catch (err) {
    console.error("register error", err);
    res.status(500).json({ message: "Системийн алдаа" });
  }
}

async function login(req, res) {
  try {
    const { phone, password, remember } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ message: "Утас, нууц үг оруулна уу" });
    }
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: "Нэвтрэх мэдээлэл буруу" });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(400).json({ message: "Нэвтрэх мэдээлэл буруу" });
    }
    const firstLogin = !user.lastLoginAt;
    user.lastLoginAt = new Date();
    await user.save();

    if (firstLogin) {
      await applyCardChange(user, 3, "bonus_card", null, { reason: "first_login_bonus" });
    }
    const tokenAge = remember ? REMEMBER_TOKEN_AGE : DEFAULT_TOKEN_AGE;
    const token = signToken(user, tokenAge);
    setAuthCookie(res, token, tokenAge);
    res.json(safeUser(user));
  } catch (err) {
    console.error("login error", err);
    res.status(500).json({ message: "Системийн алдаа" });
  }
}

async function me(req, res) {
  res.json(safeUser(req.user));
}

async function logout(req, res) {
  res.clearCookie("token");
  res.json({ message: "Амжилттай гарлаа" });
}

async function resetPassword(req, res) {
  try {
    const { phone, newPassword } = req.body;
    if (!phone || !newPassword) return res.status(400).json({ message: "Утас, шинэ нууц үг заавал" });
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: "Бүртгэл олдсонгүй" });
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Нууц үг шинэчлэгдлээ. Дахин нэвтэрнэ үү." });
  } catch (err) {
    console.error("resetPassword error", err);
    res.status(500).json({ message: "Системийн алдаа" });
  }
}

function signToken(user, tokenAge = DEFAULT_TOKEN_AGE) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      roles: user.roles,
    },
    process.env.JWT_SECRET,
    { expiresIn: tokenAge }
  );
}

function setAuthCookie(res, token, tokenAge = DEFAULT_TOKEN_AGE) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: tokenAge * 1000,
  });
}

module.exports = { register, login, logout, me, resetPassword };
