const express = require("express");
const { 
  register, 
  login, 
  logout, 
  me, 
  resetPassword,
  getSecretQuestions,
  getSecretQuestion,
  verifySecretAnswer,
} = require("../controllers/authController");
const { authRequired } = require("../middlewares/auth");
const { authLimiter, strictLimiter } = require("../middlewares/rateLimiter");
const {
  registerValidation,
  loginValidation,
  verifySecretValidation,
  resetPasswordValidation,
} = require("../middlewares/validation");

const router = express.Router();

router.post("/register", registerValidation, register);
router.post("/login", authLimiter, loginValidation, login);
router.post("/logout", authRequired, logout);
router.get("/me", authRequired, me);

// Нууц үг сэргээх
router.get("/secret-questions", getSecretQuestions);
router.get("/secret-question/:phone", getSecretQuestion);
router.post("/verify-secret", strictLimiter, verifySecretValidation, verifySecretAnswer);
router.post("/reset-password", strictLimiter, resetPasswordValidation, resetPassword);

module.exports = router;
