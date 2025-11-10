import express from "express";
import { protect } from "../middleware/auth.js";
import {
  sendConnectionRequest,
  acceptConnection,
  rejectConnection,
  getPendingRequests,
  getNotifications,
  markNotificationsAsRead,
  getSentRequests, // ✅ Import new controller
} from "../controllers/connectionController.js";

const router = express.Router();

// ✅ Connection routes
router.post("/request/:userId", protect, sendConnectionRequest);
router.put("/accept/:fromId", protect, acceptConnection);
router.put("/reject/:fromId", protect, rejectConnection);
router.get("/requests", protect, getPendingRequests);
router.get("/notifications", protect, getNotifications);
router.put("/notifications/read", protect, markNotificationsAsRead);
router.get("/sent", protect, getSentRequests); // ✅ New route

export default router;
