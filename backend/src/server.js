const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./config/db");
const requestRoutes = require("./routes/requestRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const agentRoutes = require("./routes/agentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const { ensureBaseCargo, ensureAdmin } = require("./utils/bootstrap");
const { initSocket } = require("./socket");
const { apiLimiter } = require("./middlewares/rateLimiter");
const { errorHandler } = require("./middlewares/errorHandler");
const { initLockCleanup } = require("./utils/lockCleanup");

// Connect to database and seed
connectDB()
  .then(() => {
    ensureBaseCargo().catch((err) => console.error("Seed error", err));
    ensureAdmin().catch((err) => console.error("Admin seed error", err));
  })
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  });

const app = express();
const httpServer = http.createServer(app);

const ALLOWED_ORIGINS = (process.env.CLIENT_URL ||
  "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://localhost:3002,https://agentbuy.mn,https://www.agentbuy.mn,https://agentbuy.vercel.app,https://agentbuy.onrender.com")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(express.json({ limit: "10mb" })); // Зургийн base64 илгээхэд илүү том limit
app.set("trust proxy", 1); // Render proxy-г итгэх
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting
app.use("/api/", apiLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/requests", requestRoutes);

app.get("/", (req, res) => {
  res.send("AGENTBUY Backend API");
});

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

initSocket(httpServer, ALLOWED_ORIGINS);
initLockCleanup(); // Lock автоматаар цэвэрлэх

httpServer.listen(PORT, () => console.log("Server running on", PORT));

// Handle port already in use error gracefully
httpServer.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ Port ${PORT} is already in use!`);
    console.error("Please stop the existing server or kill the process:");
    console.error(`  lsof -ti:${PORT} | xargs kill -9`);
    console.error("Or run: ./kill-port.sh\n");
    process.exit(1);
  } else {
    console.error("Server error:", err);
    process.exit(1);
  }
});
