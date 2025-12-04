// backend/src/routes/requestRoutes.js
const express = require("express");
const Request = require("../models/requestModel");
const { Types } = require("mongoose");

const loadRequest = async (id) => {
    if (!Types.ObjectId.isValid(id)) {
        const err = new Error("Invalid id");
        err.statusCode = 400;
        throw err;
    }
    return Request.findById(id);
};
const router = express.Router();

// Create request
router.post("/", async (req, res) => {
    try {
        const { type, items, urgency } = req.body;

        if (!type || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "type, items are required" });
        }

        const newRequest = await Request.create({
            type,
            items,
            urgency: urgency || "normal",
            status: "new",
        });

        res.status(201).json(newRequest);
    } catch (err) {
        console.error("Create request error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// List requests with optional filters
router.get("/", async (req, res) => {
    try {
        const { status, type, app } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (type) filter.type = type;
        if (app) filter["items.app"] = app;

        const requests = await Request.find(filter).sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        console.error("Get requests error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Get one
router.get("/:id", async (req, res) => {
    try {
        const request = await loadRequest(req.params.id);

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        res.json(request);
    } catch (err) {
        console.error("Get single request error:", err);
        const code = err.statusCode || 500;
        res.status(code).json({ message: err.message || "Server error" });
    }
});

// Claim by agent
router.post("/:id/claim", async (req, res) => {
    try {
        const request = await loadRequest(req.params.id);
        if (!request) return res.status(404).json({ message: "Request not found" });
        if (request.status !== "new") {
            return res.status(400).json({ message: "Request already claimed" });
        }

        const hours = request.items && request.items.length > 1 ? 4 : 1;
        const until = new Date();
        until.setHours(until.getHours() + hours);

        request.claimedBy = req.body.agentId || "agent";
        request.claimedAt = new Date();
        request.researchUntil = until;
        request.status = "researching";
        await request.save();

        res.json(request);
    } catch (err) {
        console.error("Claim request error:", err);
        const code = err.statusCode || 500;
        res.status(code).json({ message: err.message || "Server error" });
    }
});

// Submit research report -> proposal sent
router.post("/:id/report", async (req, res) => {
    try {
        const request = await loadRequest(req.params.id);
        if (!request) return res.status(404).json({ message: "Request not found" });
        if (request.status !== "researching" && request.status !== "new") {
            return res.status(400).json({ message: "Cannot submit report for this status" });
        }

        const { priceCny, note, link, paymentLink, image } = req.body;
        request.report = {
            priceCny,
            note,
            link,
            paymentLink,
            image,
            submittedAt: new Date(),
        };
        request.status = "proposal_sent";
        request.paymentConfirmed = false;
        await request.save();

        res.json(request);
    } catch (err) {
        console.error("Report submit error:", err);
        const code = err.statusCode || 500;
        res.status(code).json({ message: err.message || "Server error" });
    }
});

// Rate agent/request
router.post("/:id/rate", async (req, res) => {
    try {
        const request = await loadRequest(req.params.id);
        if (!request) return res.status(404).json({ message: "Request not found" });

        const rating = Number(req.body.rating);
        if (Number.isNaN(rating) || rating < 0 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 0 and 5" });
        }

        request.rating = rating;
        await request.save();
        res.json(request);
    } catch (err) {
        console.error("Rate request error:", err);
        const code = err.statusCode || 500;
        res.status(code).json({ message: err.message || "Server error" });
    }
});

// Confirm payment
router.post("/:id/pay", async (req, res) => {
    try {
        const request = await loadRequest(req.params.id);
        if (!request) return res.status(404).json({ message: "Request not found" });
        if (!request.report) return res.status(400).json({ message: "Report not submitted yet" });

        request.paymentConfirmed = true;
        request.paymentAt = new Date();
        request.status = "closed_success";
        await request.save();
        res.json(request);
    } catch (err) {
        console.error("Pay request error:", err);
        const code = err.statusCode || 500;
        res.status(code).json({ message: err.message || "Server error" });
    }
});

// Cancel order after proposal (user declined)
router.post("/:id/cancel", async (req, res) => {
    try {
        const request = await loadRequest(req.params.id);
        if (!request) return res.status(404).json({ message: "Request not found" });

        request.status = "closed_cancelled";
        request.paymentConfirmed = false;
        await request.save();
        res.json(request);
    } catch (err) {
        console.error("Cancel request error:", err);
        const code = err.statusCode || 500;
        res.status(code).json({ message: err.message || "Server error" });
    }
});

module.exports = router;
