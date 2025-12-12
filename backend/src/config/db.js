// backend/src/config/db.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

async function connectDB() {
  try {
    await prisma.$connect();
    console.log("Database connected (Prisma + Supabase Postgres)");
  } catch (err) {
    console.error("Database connection error:", err.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

module.exports = { connectDB, prisma };
