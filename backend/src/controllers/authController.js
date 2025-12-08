const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/userModel");
const CardTransaction = require("../models/cardTransactionModel");
const { ROLES } = require("../constants/roles");
const { safeUser } = require("./utils");
const { applyCardChange } = require("../services/cardService");

const DEFAULT_TOKEN_AGE = 60 * 60 * 24 * 7; // 7 хоног
const REMEMBER_TOKEN_AGE = 60 * 60 * 24 * 30; // 30 хоног
const RESET_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 минут

// Нууц асуултууд
const SECRET_QUESTIONS = [
  "Ээжийнхээ нэр юу вэ?",
  "Анхны гах амьтныхаа нэр?",
  "Төрсөн хотын нэр?",
  "Дуртай хоолны нэр?",
];

async function register(req, res) {
  try {
    const { phone, email, password, fullName, role, secretQuestion, secretAnswer } = req.body;

    if (!phone || !password || !fullName) {
      return res.status(400).json({ message: "Утас, нууц үг, нэр заавал шаардлагатай" });
    }

    if (!secretQuestion || !secretAnswer) {
      return res.status(400).json({ message: "Нууц асуулт, хариулт заавал шаардлагатай" });
    }

    if (!SECRET_QUESTIONS.includes(secretQuestion)) {
      return res.status(400).json({ message: "Буруу нууц асуулт сонгосон байна" });
    }

    const exists = await User.findOne({ phone });
    if (exists) {
      return res.status(400).json({ message: "Энэ утсаар бүртгэлтэй байна" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const secretAnswerHash = await bcrypt.hash(secretAnswer.toLowerCase().trim(), 10);
    const roles = [role].filter((r) => [ROLES.USER, ROLES.AGENT].includes(r));
    
    const user = await User.create({
      phone,
      email,
      passwordHash,
      fullName,
      secretQuestion,
      secretAnswerHash,
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
    console.log(`[Auth] Login attempt: phone=${phone}, remember=${remember} (type: ${typeof remember})`);
    
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
    
    // remember параметр зөв унших (string "true" эсвэл boolean true)
    const shouldRemember = remember === true || remember === "true" || remember === 1;
    const tokenAge = shouldRemember ? REMEMBER_TOKEN_AGE : DEFAULT_TOKEN_AGE;
    const token = signToken(user, tokenAge);
    setAuthCookie(res, token, tokenAge);
    
    console.log(`[Auth] ✅ Login success: ${user.phone}, remember=${shouldRemember}, tokenAge=${tokenAge}s (${tokenAge / 86400} хоног)`);
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

// Нууц асуултын жагсаалт буцаах
async function getSecretQuestions(_req, res) {
  res.json({ questions: SECRET_QUESTIONS });
}

// Хэрэглэгчийн нууц асуултыг буцаах
async function getSecretQuestion(req, res) {
  try {
    const { phone } = req.params;
    if (!phone) {
      return res.status(400).json({ message: "Утасны дугаар шаардлагатай" });
    }
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "Бүртгэл олдсонгүй" });
    }
    res.json({ question: user.secretQuestion });
  } catch (err) {
    console.error("getSecretQuestion error", err);
    res.status(500).json({ message: "Системийн алдаа" });
  }
}

// Нууц асуултын хариултыг шалгах
async function verifySecretAnswer(req, res) {
  try {
    const { phone, secretAnswer } = req.body;
    if (!phone || !secretAnswer) {
      return res.status(400).json({ message: "Утас болон хариулт заавал" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "Бүртгэл олдсонгүй" });
    }

    const isMatch = await bcrypt.compare(secretAnswer.toLowerCase().trim(), user.secretAnswerHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Нууц асуултын хариулт буруу байна" });
    }

    // Reset token үүсгэх
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRY);
    await user.save();

    res.json({ 
      message: "Баталгаажлаа", 
      resetToken,
      expiresIn: RESET_TOKEN_EXPIRY / 1000 // секундээр
    });
  } catch (err) {
    console.error("verifySecretAnswer error", err);
    res.status(500).json({ message: "Системийн алдаа" });
  }
}

// Нууц үг сэргээх (одоо reset token шаардана)
async function resetPassword(req, res) {
  try {
    const { phone, newPassword, resetToken } = req.body;
    
    if (!phone || !newPassword || !resetToken) {
      return res.status(400).json({ message: "Утас, шинэ нууц үг, resetToken заавал" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "Бүртгэл олдсонгүй" });
    }

    // Reset token шалгах
    if (user.resetToken !== resetToken) {
      return res.status(400).json({ message: "Буруу эсвэл хугацаа дууссан token" });
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return res.status(400).json({ message: "Token-ийн хугацаа дууссан байна. Дахин оролдоно уу." });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
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
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: tokenAge * 1000,
  });
}

module.exports = { 
  register, 
  login, 
  logout, 
  me, 
  resetPassword,
  getSecretQuestions,
  getSecretQuestion,
  verifySecretAnswer,
};
