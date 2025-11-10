import express from "express";
import { protect } from "../middleware/auth.js";
import {
  sendMessage,
  getConversation,
  getRecentChats,
} from "../controllers/messageController.js";

const router = express.Router();

router.post("/", protect, sendMessage);
router.get("/recent", protect, getRecentChats);
router.get("/:userId", protect, getConversation);

export default router;
