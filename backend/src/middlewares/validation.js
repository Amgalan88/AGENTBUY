const { body, param, validationResult } = require("express-validator");

// Validation алдаануудыг шалгах middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return res.status(400).json({ message: messages.join(", ") });
  }
  next();
};

// ========== Auth Validations ==========

const registerValidation = [
  body("phone")
    .notEmpty().withMessage("Утасны дугаар заавал")
    .isMobilePhone("any").withMessage("Буруу утасны дугаар"),
  body("password")
    .isLength({ min: 6 }).withMessage("Нууц үг хамгийн багадаа 6 тэмдэгт"),
  body("fullName")
    .notEmpty().withMessage("Нэр заавал")
    .isLength({ min: 2 }).withMessage("Нэр хамгийн багадаа 2 тэмдэгт"),
  body("secretQuestion")
    .notEmpty().withMessage("Нууц асуулт заавал"),
  body("secretAnswer")
    .notEmpty().withMessage("Нууц асуултын хариулт заавал"),
  validate,
];

const loginValidation = [
  body("phone").notEmpty().withMessage("Утасны дугаар заавал"),
  body("password").notEmpty().withMessage("Нууц үг заавал"),
  validate,
];

const verifySecretValidation = [
  body("phone").notEmpty().withMessage("Утасны дугаар заавал"),
  body("secretAnswer").notEmpty().withMessage("Хариулт заавал"),
  validate,
];

const resetPasswordValidation = [
  body("phone").notEmpty().withMessage("Утасны дугаар заавал"),
  body("newPassword")
    .isLength({ min: 6 }).withMessage("Нууц үг хамгийн багадаа 6 тэмдэгт"),
  body("resetToken").notEmpty().withMessage("Reset token заавал"),
  validate,
];

// ========== Order Validations ==========

const createOrderValidation = [
  body("items")
    .isArray({ min: 1 }).withMessage("Дор хаяж 1 бараа оруулна уу"),
  body("items.*.title")
    .notEmpty().withMessage("Барааны нэр заавал"),
  body("cargoId")
    .notEmpty().withMessage("Карго сонгоно уу")
    .isMongoId().withMessage("Буруу карго ID"),
  validate,
];

const orderIdValidation = [
  param("id").isMongoId().withMessage("Буруу захиалгын ID"),
  validate,
];

// ========== Agent Validations ==========

const submitReportValidation = [
  param("id").isMongoId().withMessage("Буруу захиалгын ID"),
  body("items").isArray().withMessage("Items массив байх ёстой"),
  body("pricing").isObject().withMessage("Pricing объект байх ёстой"),
  validate,
];

const trackingValidation = [
  param("id").isMongoId().withMessage("Буруу захиалгын ID"),
  body("code").notEmpty().withMessage("Tracking код заавал"),
  validate,
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  verifySecretValidation,
  resetPasswordValidation,
  createOrderValidation,
  orderIdValidation,
  submitReportValidation,
  trackingValidation,
};
