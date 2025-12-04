const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const requestRoutes = require("./routes/requestRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const agentRoutes = require("./routes/agentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const { ensureBaseCargo, ensureAdmin } = require("./utils/bootstrap");
const { initSocket } = require("./socket");

dotenv.config();
connectDB();
ensureBaseCargo().catch((err) => console.error("Seed error", err));
ensureAdmin().catch((err) => console.error("Admin seed error", err));

const app = express();
const httpServer = http.createServer(app);

const ALLOWED_ORIGINS = (process.env.CLIENT_URL ||
  "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://localhost:3002")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/requests", requestRoutes);

app.get("/", (req, res) => {
  res.send("HELLO ADMIN I,M BACKEND HERE");
});

const PORT = process.env.PORT || 5000;

initSocket(httpServer, ALLOWED_ORIGINS);
httpServer.listen(PORT, () => console.log("Server running on", PORT));
