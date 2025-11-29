import express from "express";
import { protect } from "../middleware/auth.js";
import {
  sendMessage,
  getConversation,
  getRecentChats,
} from "../controllers/messageController.js";

const router = express.Router();

/* ============================================================
   SEND MESSAGE
   POST /api/messages
   Body: { to: userId, text: "Hello" }
============================================================ */
router.post("/", protect, sendMessage);

/* ============================================================
   GET RECENT CHATS LIST
   GET /api/messages/recent
============================================================ */
router.get("/recent", protect, getRecentChats);

/* ============================================================
   GET CONVERSATION WITH A USER
   GET /api/messages/:userId
============================================================ */
router.get("/:userId", protect, getConversation);

export default router;
