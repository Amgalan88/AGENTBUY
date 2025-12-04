const express = require("express");
const { register, login, logout, me, resetPassword } = require("../controllers/authController");
const { authRequired } = require("../middlewares/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authRequired, logout);
router.get("/me", authRequired, me);
router.post("/reset-password", resetPassword);

module.exports = router;
