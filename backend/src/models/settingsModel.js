const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "default" },
    cnyRate: { type: Number, default: 0 },
    bankName: { type: String },
    bankAccount: { type: String },
    bankOwner: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
