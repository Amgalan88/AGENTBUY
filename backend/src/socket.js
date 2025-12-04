const { Server } = require("socket.io");

let io;

function initSocket(httpServer, allowedOrigins = []) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error("Not allowed by CORS (socket)"));
      },
      credentials: true,
    },
  });
  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

module.exports = { initSocket, getIO };
