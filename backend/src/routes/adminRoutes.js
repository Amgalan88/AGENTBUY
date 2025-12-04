const express = require("express");
const {
  listCargos,
  createCargo,
  listOrders,
  listAgents,
  verifyAgent,
  updateCargoStatus,
  deleteCargo,
  updateAgentActive,
  getSettings,
  updateSettings,
  confirmPayment,
  updateTracking,
} = require("../controllers/adminController");
const { authRequired, requireRole } = require("../middlewares/auth");
const { ROLES } = require("../constants/roles");

const router = express.Router();
const adminRoles = [ROLES.ADMIN, ROLES.SUPER_ADMIN];

router.get("/cargos", authRequired, requireRole(...adminRoles), listCargos);
router.post("/cargos", authRequired, requireRole(...adminRoles), createCargo);
router.post("/cargos/:id/status", authRequired, requireRole(...adminRoles), updateCargoStatus);
router.delete("/cargos/:id", authRequired, requireRole(...adminRoles), deleteCargo);
router.get("/orders", authRequired, requireRole(...adminRoles), listOrders);
router.post("/orders/:id/confirm-payment", authRequired, requireRole(...adminRoles), confirmPayment);
router.post("/orders/:id/tracking", authRequired, requireRole(...adminRoles), updateTracking);
router.get("/agents", authRequired, requireRole(...adminRoles), listAgents);
router.post("/agents/:id/verify", authRequired, requireRole(...adminRoles), verifyAgent);
router.post("/agents/:id/status", authRequired, requireRole(...adminRoles), updateAgentActive);
router.get("/settings", authRequired, requireRole(...adminRoles), getSettings);
router.post("/settings", authRequired, requireRole(...adminRoles), updateSettings);

module.exports = router;
