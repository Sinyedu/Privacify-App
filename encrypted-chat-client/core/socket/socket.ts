import { io } from "socket.io-client";

export const socket = io(process.env.NEXT_PUBLIC_API_URL!, {
  transports: ["websocket"],
  autoConnect: false,
});

socket.on("connect", () => {
  console.log("[socket] connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("[socket] disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.log("[socket] connect_error:", err.message);
});
