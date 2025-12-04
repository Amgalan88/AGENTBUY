const express = require("express");
const {
  listAvailable,
  getOrder,
  listMyOrders,
  lockOrder,
  startResearch,
  submitReport,
  updateTracking,
} = require("../controllers/agentController");
const { authRequired, requireRole, ensureAgentVerified } = require("../middlewares/auth");
const { ROLES } = require("../constants/roles");

const router = express.Router();
const agentOnly = [ROLES.AGENT];

router.get("/orders/available", authRequired, requireRole(...agentOnly), ensureAgentVerified, listAvailable);
router.get("/orders/:id", authRequired, requireRole(...agentOnly), ensureAgentVerified, getOrder);
router.get("/orders", authRequired, requireRole(...agentOnly), ensureAgentVerified, listMyOrders);
router.post("/orders/:id/lock", authRequired, requireRole(...agentOnly), ensureAgentVerified, lockOrder);
router.post("/orders/:id/start", authRequired, requireRole(...agentOnly), ensureAgentVerified, startResearch);
router.post("/orders/:id/report", authRequired, requireRole(...agentOnly), ensureAgentVerified, submitReport);
router.post("/orders/:id/tracking", authRequired, requireRole(...agentOnly), ensureAgentVerified, updateTracking);

module.exports = router;
