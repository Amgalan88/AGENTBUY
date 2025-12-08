const mongoose = require("mongoose");

const cardRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    quantity: { type: Number, required: true, min: 1 }, // Хэдэн карт авах
    pricePerCard: { type: Number, default: 2000 }, // Карт бүрийн үнэ (MNT)
    totalAmount: { type: Number, required: true }, // Нийт дүн (quantity * pricePerCard)
    status: {
      type: String,
      enum: ["pending", "confirmed", "rejected"],
      default: "pending",
    },
    paymentInfo: {
      bankName: { type: String },
      bankAccount: { type: String },
      bankOwner: { type: String },
    },
    paymentProof: { type: String }, // Төлбөрийн баримт (image URL)
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Админ
    confirmedAt: { type: Date },
    rejectedReason: { type: String },
  },
  { timestamps: true }
);

// Indexes
cardRequestSchema.index({ userId: 1, status: 1 });
cardRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("CardRequest", cardRequestSchema);

