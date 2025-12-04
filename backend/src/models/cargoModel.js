const mongoose = require("mongoose");

const cargoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    siteUrl: { type: String },
    logoUrl: { type: String },
    contactPhone: { type: String },
    isActive: { type: Boolean, default: true },
    supportedCities: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cargo", cargoSchema);
