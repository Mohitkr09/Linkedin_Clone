import express from "express";
import {
  sendConnectionRequest,
  acceptConnection,
  rejectConnection,
  getPendingRequests,
  getNotifications,
  markNotificationsAsRead,
} from "../controllers/connectionController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/request/:userId", protect, sendConnectionRequest);
router.put("/accept/:fromId", protect, acceptConnection);
router.put("/reject/:fromId", protect, rejectConnection);
router.get("/requests", protect, getPendingRequests);
router.get("/notifications", protect, getNotifications);
router.put("/notifications/read", protect, markNotificationsAsRead);
export default router;
