const jwt = require("jsonwebtoken");
const { prisma } = require("../config/db");
const { ROLES } = require("../constants/roles");

async function authRequired(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: "Нэвтрээгүй байна" });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
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
    const userId = req.user.id || req.user._id;
    const profile = await prisma.agentProfile.findUnique({ where: { userId } });
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
