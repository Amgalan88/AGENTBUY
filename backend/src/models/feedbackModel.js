const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    roleFrom: { type: String, required: true },
    roleTo: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
