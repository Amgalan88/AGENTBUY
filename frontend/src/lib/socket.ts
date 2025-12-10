import { io, Socket } from "socket.io-client";

export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  // Client-side дээр байгаа эсэхийг шалгах
  if (typeof window === "undefined") {
    return null;
  }

  // Socket аль хэдийн холбогдсон бол буцаах
  if (socket?.connected) {
    return socket;
  }

  // Шинэ socket холболт үүсгэх
  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("[Socket] Connected:", socket?.id);
  });

  socket.on("disconnect", () => {
    console.log("[Socket] Disconnected");
  });

  socket.on("connect_error", (error) => {
    console.error("[Socket] Connection error:", error);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

