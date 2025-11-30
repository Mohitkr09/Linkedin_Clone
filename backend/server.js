// backend/server.js

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import connectDB from "./config/db.js";

// Models
import Message from "./models/Message.js";

// Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import connectionRoutes from "./routes/connections.js";
import messageRoutes from "./routes/messages.js";

// Load ENV
dotenv.config();
console.log("📦 Environment Variables Loaded:");
console.log({
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI ? "✅ Present" : "❌ Missing",
  JWT_SECRET: process.env.JWT_SECRET ? "✅ Present" : "❌ Missing",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? "✅ Present" : "❌ Missing",
});

// Connect DB
connectDB();

const app = express();

// Body Parser
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

/* ========================================================
   CORS CONFIGURATION
======================================================== */
const allowedOrigins = [
  "http://localhost:5173",
  /\.vercel\.app$/,
  "https://linkedin-clone-vs16.onrender.com",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const allowed = allowedOrigins.some((rule) =>
        rule instanceof RegExp ? rule.test(origin) : rule === origin
      );
      allowed
        ? callback(null, true)
        : callback(new Error("🚫 Not allowed by CORS: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ========================================================
   DEBUG LOGGER
======================================================== */
app.use((req, res, next) => {
  console.log(`➡️  ${req.method} ${req.originalUrl}`);
  next();
});

/* ========================================================
   STATIC FILES
======================================================== */
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* ========================================================
   ROUTES
======================================================== */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);           // ⭐ includes update + delete avatar
app.use("/api/posts", postRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/messages", messageRoutes);

app.get("/api/health", (req, res) => res.send("✅ Backend is running fine!"));

// ========================================================
// SOCKET.IO INITIALIZATION
// ========================================================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", /\.vercel\.app$/],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  },
});

// ========================================================
// SOCKET EVENTS
// ========================================================
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 New socket connected:", socket.id);

  socket.on("registerUser", (userId) => {
    if (userId) {
      onlineUsers.set(userId, socket.id);
      console.log(`✅ Registered user ${userId} -> socket ${socket.id}`);
    }
  });

  socket.on("sendMessage", async ({ senderId, receiverId, content }) => {
    try {
      if (!senderId || !receiverId || !content) return;

      const newMessage = await Message.create({ sender: senderId, receiver: receiverId, content });
      const populatedMsg = await newMessage.populate([
        { path: "sender", select: "name avatar" },
        { path: "receiver", select: "name avatar" },
      ]);

      const receiverSocket = onlineUsers.get(receiverId);
      if (receiverSocket) io.to(receiverSocket).emit("receiveMessage", populatedMsg);

      socket.emit("receiveMessage", populatedMsg);
      console.log(`📨 Message ${senderId} → ${receiverId}`);
    } catch (err) {
      console.error("❌ sendMessage Error:", err);
    }
  });

  socket.on("disconnect", () => {
    for (const [userId, id] of onlineUsers.entries()) {
      if (id === socket.id) {
        onlineUsers.delete(userId);
        console.log(`🔴 User disconnected: ${userId}`);
        break;
      }
    }
  });
});

// ========================================================
// SOCKET NOTIFICATIONS
// ========================================================
export const sendNotification = (userId, notification) => {
  const socketId = onlineUsers.get(userId);
  if (socketId) {
    io.to(socketId).emit("newNotification", notification);
    console.log(`📢 Notification sent to ${userId}: ${notification.message}`);
  } else {
    console.log(`⚠️ User offline — notification stored`);
  }
};

// ========================================================
// ERROR HANDLERS
// ========================================================
process.on("uncaughtException", (err) =>
  console.error("❌ Uncaught Exception:", err)
);
process.on("unhandledRejection", (err) =>
  console.error("❌ Unhandled Promise Rejection:", err)
);

// ========================================================
// START SERVER
// ========================================================
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("🌐 Allowed Origins:", allowedOrigins);
});
