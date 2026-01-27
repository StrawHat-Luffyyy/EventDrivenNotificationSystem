import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000", 
      credentials: true,
    },
  });
  io.on("connection", (socket) => {
    console.log("New client connected", socket.id);
    socket.on("join", (userId) => {
      socket.join(userId);
    });
    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
    });
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
