const express = require("express");
const {
  createDraft,
  publishOrder,
  listUserOrders,
  getOrderDetail,
  cancelBeforeAgent,
  cancelAfterReport,
  acceptReport,
  confirmCompleted,
  addComment,
} = require("../controllers/orderController");
const { authRequired, requireRole } = require("../middlewares/auth");
const { ROLES } = require("../constants/roles");
const { createOrderValidation, orderIdValidation } = require("../middlewares/validation");

const router = express.Router();
// Үндсэндээ хэрэглэгч захиалга үүсгэнэ, гэхдээ хөгжүүлэлт/туршилтын үед агент эрхтэйгээр үзэх боломжтой болгох
const userAllowed = [ROLES.USER, ROLES.AGENT];

router.post("/", authRequired, requireRole(...userAllowed), createOrderValidation, createDraft);
router.post("/:id/publish", authRequired, requireRole(...userAllowed), orderIdValidation, publishOrder);
router.get("/", authRequired, requireRole(...userAllowed), listUserOrders);
router.get("/:id", authRequired, requireRole(...userAllowed), orderIdValidation, getOrderDetail);
router.post("/:id/cancel-before-agent", authRequired, requireRole(...userAllowed), orderIdValidation, cancelBeforeAgent);
router.post("/:id/cancel-after-report", authRequired, requireRole(...userAllowed), orderIdValidation, cancelAfterReport);
router.post("/:id/request-order", authRequired, requireRole(...userAllowed), orderIdValidation, acceptReport);
router.post("/:id/complete", authRequired, requireRole(...userAllowed), orderIdValidation, confirmCompleted);
router.post("/:id/comment", authRequired, requireRole(...userAllowed), orderIdValidation, addComment);

module.exports = router;

