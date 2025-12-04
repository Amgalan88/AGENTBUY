const express = require("express");
const Settings = require("../models/settingsModel");

const router = express.Router();

router.get("/", async (_req, res) => {
  const doc = await Settings.findOne({ key: "default" });
  res.json(doc || {});
});

module.exports = router;
