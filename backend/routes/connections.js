import express from "express";
import { protect } from "../middleware/auth.js";
import {
  sendConnectionRequest,
  acceptConnection,
  rejectConnection,
  getPendingRequests,
  getNotifications,
  markNotificationsAsRead,
  getSentRequests,
  cancelConnectionRequest, // 👈 ADD THIS
} from "../controllers/connectionController.js";

const router = express.Router();

// 📌 Send new request
router.post("/request/:userId", protect, sendConnectionRequest);

// 📌 Accept request
router.put("/accept/:fromId", protect, acceptConnection);

// 📌 Reject request
router.put("/reject/:fromId", protect, rejectConnection);

// 📌 Cancel a sent request (NEW)
router.delete("/request/cancel/:userId", protect, cancelConnectionRequest); // 👈 ADD THIS

// 📌 All pending received requests
router.get("/requests", protect, getPendingRequests);

// 📌 Notifications
router.get("/notifications", protect, getNotifications);

// 📌 Mark all notifications as read
router.put("/notifications/read", protect, markNotificationsAsRead);

// 📌 Users who have pending requests FROM me
router.get("/sent", protect, getSentRequests);

export default router;
