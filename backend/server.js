// server.js
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

dotenv.config();
connectDB();

const app = express();

/* ========================================================
   ✅ BODY PARSER & PAYLOAD SIZE FIX
======================================================== */
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

/* ========================================================
   ✅ CORS CONFIGURATION (Frontend: http://localhost:5173)
======================================================== */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ========================================================
   ✅ STATIC FILES (Local Upload Fallback)
======================================================== */
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* ========================================================
   ✅ API ROUTES
======================================================== */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/messages", messageRoutes);

/* ========================================================
   ✅ HTTP SERVER + SOCKET.IO INITIALIZATION
======================================================== */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  },
});

/* ========================================================
   ✅ SOCKET.IO — ONLINE USERS & EVENTS
======================================================== */
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 New socket connected:", socket.id);

  // ✅ Register a connected user
  socket.on("registerUser", (userId) => {
    if (userId) {
      onlineUsers.set(userId, socket.id);
      console.log(`✅ Registered ${userId} with socket ${socket.id}`);
    }
  });

  // ✅ Handle sending messages (real-time + DB save)
  socket.on("sendMessage", async ({ senderId, receiverId, content }) => {
    try {
      if (!senderId || !receiverId || !content) {
        console.warn("⚠️ Invalid message payload received:", {
          senderId,
          receiverId,
          content,
        });
        return;
      }

      console.log("📥 Message received for saving:", { senderId, receiverId, content });

      // ✅ Save message to MongoDB
      const newMessage = await Message.create({
        sender: senderId,
        receiver: receiverId,
        content,
      });

      // ✅ Populate user details for front-end
      const populatedMsg = await newMessage.populate([
        { path: "sender", select: "name avatar" },
        { path: "receiver", select: "name avatar" },
      ]);

      // ✅ Send message to receiver (if online)
      const receiverSocket = onlineUsers.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit("receiveMessage", populatedMsg);
      }

      // ✅ Echo message to sender (so they see it instantly)
      socket.emit("receiveMessage", populatedMsg);

      console.log(`📩 Message sent from ${senderId} → ${receiverId}`);
    } catch (error) {
      console.error("❌ Error sending message:", error);
    }
  });

  // ✅ Handle user disconnection
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

/* ========================================================
   ✅ SOCKET NOTIFICATION HELPERS
======================================================== */
export const sendNotification = (userId, notification) => {
  const socketId = onlineUsers.get(userId);
  if (socketId) {
    io.to(socketId).emit("newNotification", notification);
    console.log(`📢 Notification sent to ${userId}: ${notification.message}`);
  } else {
    console.log(`⚠️ User ${userId} offline — notification saved to DB.`);
  }
};

export const sendNotificationToMany = (userIds, notification) => {
  userIds.forEach((id) => {
    const socketId = onlineUsers.get(id);
    if (socketId) {
      io.to(socketId).emit("newNotification", notification);
      console.log(`📢 Broadcasted notification to ${id}`);
    }
  });
};

/* ========================================================
   ✅ GLOBAL ERROR HANDLERS
======================================================== */
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
});

io.on("error", (err) => {
  console.error("❌ Socket.IO Error:", err.message);
});

/* ========================================================
   ✅ START SERVER
======================================================== */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("🌐 CORS enabled for http://localhost:5173");
});
