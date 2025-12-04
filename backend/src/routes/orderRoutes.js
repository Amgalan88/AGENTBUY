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
} = require("../controllers/orderController");
const { authRequired, requireRole } = require("../middlewares/auth");
const { ROLES } = require("../constants/roles");

const router = express.Router();
// Үндсэндээ хэрэглэгч захиалга үүсгэнэ, гэхдээ хөгжүүлэлт/туршилтын үед агент эрхтэйгээр үзэх боломжтой болгох
const userAllowed = [ROLES.USER, ROLES.AGENT];

router.post("/", authRequired, requireRole(...userAllowed), createDraft);
router.post("/:id/publish", authRequired, requireRole(...userAllowed), publishOrder);
router.get("/", authRequired, requireRole(...userAllowed), listUserOrders);
router.get("/:id", authRequired, requireRole(...userAllowed), getOrderDetail);
router.post("/:id/cancel-before-agent", authRequired, requireRole(...userAllowed), cancelBeforeAgent);
router.post("/:id/cancel-after-report", authRequired, requireRole(...userAllowed), cancelAfterReport);
router.post("/:id/request-order", authRequired, requireRole(...userAllowed), acceptReport);
router.post("/:id/complete", authRequired, requireRole(...userAllowed), confirmCompleted);

module.exports = router;
