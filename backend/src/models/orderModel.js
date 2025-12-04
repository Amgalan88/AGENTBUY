const mongoose = require("mongoose");
const { ORDER_STATUS } = require("../constants/orderStatus");

const orderItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    imageUrl: { type: String },
    images: [{ type: String }],
    sourceUrl: { type: String },
    quantity: { type: Number, default: 1 },
    userNotes: { type: String },
    agentPrice: { type: Number },
    agentCurrency: { type: String, default: "CNY" },
    agentTotal: { type: Number },
    packageIndex: { type: Number },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cargoId: { type: mongoose.Schema.Types.ObjectId, ref: "Cargo" },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.DRAFT,
    },
    isPackage: { type: Boolean, default: false },
    items: [orderItemSchema],
    userNote: { type: String },
    agentNote: { type: String },
    lock: {
      lockedByAgentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      lockedAt: { type: Date },
      expiresAt: { type: Date },
      extensionCount: { type: Number, default: 0 },
    },
    pricing: {
      productTotalCny: { type: Number },
      domesticShippingCny: { type: Number },
      serviceFeeCny: { type: Number },
      otherFeesCny: { type: Number },
      grandTotalCny: { type: Number },
      exchangeRate: { type: Number },
      grandTotalMnt: { type: Number },
    },
    payment: {
      status: { type: String },
      invoiceId: { type: String },
      paidAt: { type: Date },
      amountMnt: { type: Number },
      method: { type: String },
      providerTxnId: { type: String },
      deadline: { type: Date },
    },
    tracking: {
      code: { type: String },
      carrierName: { type: String },
      lastStatus: { type: String },
      lastUpdatedAt: { type: Date },
    },
    report: {
      items: [
        {
          title: { type: String },
          imageUrl: { type: String },
          sourceUrl: { type: String },
          quantity: { type: Number },
          agentPrice: { type: Number },
        agentCurrency: { type: String, default: "CNY" },
        agentTotal: { type: Number },
        note: { type: String },
        images: [{ type: String }],
      },
    ],
    pricing: {
      productTotalCny: { type: Number },
        domesticShippingCny: { type: Number },
        serviceFeeCny: { type: Number },
        otherFeesCny: { type: Number },
        grandTotalCny: { type: Number },
        exchangeRate: { type: Number },
        grandTotalMnt: { type: Number },
      },
      agentComment: { type: String },
      submittedAt: { type: Date },
    },
    ratingByUser: {
      score: { type: Number },
      comment: { type: String },
    },
    ratingByAgent: {
      score: { type: Number },
      comment: { type: String },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
