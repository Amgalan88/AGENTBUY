const rateLimit = require("express-rate-limit");

// Ерөнхий API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 1000, // 1000 хүсэлт (dev орчинд)
  message: { message: "Хэт олон хүсэлт илгээлээ. 15 минутын дараа оролдоно уу." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoint-уудад хатуу rate limiter
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 цаг
  max: 10, // 10 оролдлого
  message: { message: "Нэвтрэх оролдлого хэтэрсэн. 1 цагийн дараа оролдоно уу." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Нууц асуулт шалгахад маш хатуу rate limiter
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 цаг
  max: 5, // 5 оролдлого
  message: { message: "Хэт олон буруу оролдлого. 1 цагийн дараа оролдоно уу." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiLimiter, authLimiter, strictLimiter };
