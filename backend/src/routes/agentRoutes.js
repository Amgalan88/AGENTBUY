const express = require("express");
const {
  listAvailable,
  getOrder,
  listMyOrders,
  lockOrder,
  startResearch,
  submitReport,
  updateTracking,
  addAgentComment,
} = require("../controllers/agentController");
const { authRequired, requireRole, ensureAgentVerified } = require("../middlewares/auth");
const { ROLES } = require("../constants/roles");
const { orderIdValidation, submitReportValidation, trackingValidation } = require("../middlewares/validation");

const router = express.Router();
const agentOnly = [ROLES.AGENT];

router.get("/orders/available", authRequired, requireRole(...agentOnly), ensureAgentVerified, listAvailable);
router.get("/orders/:id", authRequired, requireRole(...agentOnly), ensureAgentVerified, orderIdValidation, getOrder);
router.get("/orders", authRequired, requireRole(...agentOnly), ensureAgentVerified, listMyOrders);
router.post("/orders/:id/lock", authRequired, requireRole(...agentOnly), ensureAgentVerified, orderIdValidation, lockOrder);
router.post("/orders/:id/start", authRequired, requireRole(...agentOnly), ensureAgentVerified, orderIdValidation, startResearch);
router.post("/orders/:id/report", authRequired, requireRole(...agentOnly), ensureAgentVerified, submitReportValidation, submitReport);
router.post("/orders/:id/tracking", authRequired, requireRole(...agentOnly), ensureAgentVerified, trackingValidation, updateTracking);
router.post("/orders/:id/comment", authRequired, requireRole(...agentOnly), ensureAgentVerified, orderIdValidation, addAgentComment);

module.exports = router;

