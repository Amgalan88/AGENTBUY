const mongoose = require("mongoose");
const { ROLES } = require("../constants/roles");

const userSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true },
    email: { type: String, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true },
    avatarUrl: { type: String },
    roles: {
      type: [String],
      enum: Object.values(ROLES),
      default: [ROLES.USER],
    },
    defaultCargoId: { type: mongoose.Schema.Types.ObjectId, ref: "Cargo" },
  cardBalance: { type: Number, default: 5 },
    cardProgress: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
