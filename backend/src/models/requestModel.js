const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    name: String,
    mark: String,
    quantity: Number,
    app: String,
    note: String,
    link: String,
    images: [String],
});

const reportSchema = new mongoose.Schema(
    {
        priceCny: Number,
        note: String,
        link: String,
        paymentLink: String,
        image: String,
        submittedAt: Date,
    },
    { _id: false }
);

const requestSchema = new mongoose.Schema(
    {
        type: String, // single | batch
        items: [itemSchema],
        urgency: {
            type: String,
            default: "normal",
        },
        status: {
            type: String,
            default: "new",
        },
        claimedBy: String,
        claimedAt: Date,
        researchUntil: Date,
        report: reportSchema,
        rating: Number,
        paymentConfirmed: {
            type: Boolean,
            default: false,
        },
        paymentAt: Date,
    },
    { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);
