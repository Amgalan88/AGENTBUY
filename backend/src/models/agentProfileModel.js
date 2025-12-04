const mongoose = require("mongoose");

const agentProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    totalEarnedMnt: { type: Number, default: 0 },
    tags: [{ type: String }],
    languages: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("AgentProfile", agentProfileSchema);
