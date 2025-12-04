const mongoose = require("mongoose");

const cardTransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    type: {
      type: String,
      enum: [
        "init",
        "consume",
        "return",
        "consume_kept",
        "bonus_progress",
        "bonus_card",
        "gift_send",
        "gift_receive",
        "buy_package",
        "sell_to_admin",
      ],
    },
    cardChange: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    meta: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CardTransaction", cardTransactionSchema);
