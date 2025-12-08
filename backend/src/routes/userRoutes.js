const express = require("express");
const { getProfile, listCargos, setDefaultCargo, requestCards, getMyCardRequests } = require("../controllers/userController");
const { authRequired, requireRole } = require("../middlewares/auth");
const { ROLES } = require("../constants/roles");

const router = express.Router();

router.get("/profile", authRequired, requireRole(ROLES.USER, ROLES.AGENT, ROLES.ADMIN, ROLES.SUPER_ADMIN), getProfile);
router.get("/cargos", authRequired, listCargos);
router.post("/default-cargo", authRequired, requireRole(ROLES.USER, ROLES.AGENT), setDefaultCargo);
router.post("/cards/request", authRequired, requireRole(ROLES.USER, ROLES.AGENT), requestCards);
router.get("/cards/requests", authRequired, requireRole(ROLES.USER, ROLES.AGENT), getMyCardRequests);

module.exports = router;
