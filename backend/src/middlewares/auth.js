const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { ROLES } = require("../constants/roles");
const AgentProfile = require("../models/agentProfileModel");

async function authRequired(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: "Нэвтрээгүй байна" });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: "Хэрэглэгч олдсонгүй" });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error("auth error", err);
    res.status(401).json({ message: "Нэвтрэх шаардлагатай" });
  }
}

function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) return next();
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = payload;
  } catch (err) {
    // алдаа гарсан ч үргэлжлүүлнэ
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Нэвтрээгүй байна" });
    }
    const hasRole =
      req.user.roles?.some(
        (r) => roles.includes(r) || r === ROLES.SUPER_ADMIN
      ) || false;
    if (!hasRole) {
      return res.status(403).json({ message: "Эрх хүрэхгүй" });
    }
    next();
  };
}

function extractToken(req) {
  const bearer = req.headers.authorization;
  if (bearer && bearer.startsWith("Bearer ")) {
    return bearer.slice(7);
  }
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
}

async function ensureAgentVerified(req, res, next) {
  try {
    const profile = await AgentProfile.findOne({ userId: req.user._id });
    if (!profile || profile.verificationStatus !== "verified") {
      return res.status(403).json({ message: "Агент баталгаажаагүй" });
    }
    next();
  } catch (err) {
    console.error("agent verify check error", err);
    res.status(403).json({ message: "Агент баталгаажаагүй" });
  }
}

module.exports = { authRequired, optionalAuth, requireRole, ensureAgentVerified };
