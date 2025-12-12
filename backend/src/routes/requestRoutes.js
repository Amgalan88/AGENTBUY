// backend/src/routes/requestRoutes.js
const express = require("express");
const { prisma } = require("../config/db");
const { normalizeItemImages, uploadImage } = require("../services/cloudinaryService");

const loadRequest = async (id) => {
    try {
        return await prisma.request.findUnique({
            where: { id },
            include: {
                items: true,
                report: true,
            },
        });
    } catch (err) {
        const error = new Error("Invalid id");
        error.statusCode = 400;
        throw error;
    }
};
const router = express.Router();

// Create request
router.post("/", async (req, res) => {
    try {
        const { type, items, urgency } = req.body;

        if (!type || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "type, items are required" });
        }

        const normalizedItems = await normalizeItemImages(items);

        const newRequest = await prisma.request.create({
            data: {
                type,
                urgency: urgency || "normal",
                status: "new",
                items: {
                    create: normalizedItems.map(item => ({
                        name: item.name,
                        mark: item.mark,
                        quantity: item.quantity,
                        app: item.app,
                        note: item.note,
                        link: item.link,
                        images: item.images || [],
                    })),
                },
            },
            include: {
                items: true,
            },
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
        const where = {};

        if (status) where.status = status;
        if (type) where.type = type;
        if (app) {
            where.items = {
                some: { app },
            };
        }

        const requests = await prisma.request.findMany({
            where,
            include: {
                items: true,
                report: true,
            },
            orderBy: { createdAt: "desc" },
        });
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

        const updatedRequest = await prisma.request.update({
            where: { id: request.id },
            data: {
                claimedBy: req.body.agentId || "agent",
                claimedAt: new Date(),
                researchUntil: until,
                status: "researching",
            },
            include: {
                items: true,
                report: true,
            },
        });

        res.json(updatedRequest);
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
        const uploadedImage = await uploadImage(image);
        
        // Report үүсгэх эсвэл шинэчлэх
        if (request.report) {
            await prisma.requestReport.update({
                where: { requestId: request.id },
                data: {
                    priceCny,
                    note,
                    link,
                    paymentLink,
                    image: uploadedImage,
                    submittedAt: new Date(),
                },
            });
        } else {
            await prisma.requestReport.create({
                data: {
                    requestId: request.id,
                    priceCny,
                    note,
                    link,
                    paymentLink,
                    image: uploadedImage,
                    submittedAt: new Date(),
                },
            });
        }
        
        const updatedRequest = await prisma.request.update({
            where: { id: request.id },
            data: {
                status: "proposal_sent",
                paymentConfirmed: false,
            },
            include: {
                items: true,
                report: true,
            },
        });

        res.json(updatedRequest);
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

        const updatedRequest = await prisma.request.update({
            where: { id: request.id },
            data: { rating },
            include: {
                items: true,
                report: true,
            },
        });
        res.json(updatedRequest);
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

        const updatedRequest = await prisma.request.update({
            where: { id: request.id },
            data: {
                paymentConfirmed: true,
                paymentAt: new Date(),
                status: "closed_success",
            },
            include: {
                items: true,
                report: true,
            },
        });
        res.json(updatedRequest);
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

        const updatedRequest = await prisma.request.update({
            where: { id: request.id },
            data: {
                status: "closed_cancelled",
                paymentConfirmed: false,
            },
            include: {
                items: true,
                report: true,
            },
        });
        res.json(updatedRequest);
    } catch (err) {
        console.error("Cancel request error:", err);
        const code = err.statusCode || 500;
        res.status(code).json({ message: err.message || "Server error" });
    }
});

module.exports = router;
