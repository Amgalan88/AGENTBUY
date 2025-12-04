// backend/src/config/db.js
const mongoose = require("mongoose");

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Mongo connected");
    } catch (err) {
        console.error("Mongo error:", err.message);
        process.exit(1);
    }
}

module.exports = connectDB;
