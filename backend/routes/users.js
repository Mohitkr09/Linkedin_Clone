// backend/routes/userRoutes.js

import express from "express";
import { protect } from "../middleware/auth.js";
import { memoryUpload } from "../middleware/upload.js"; // ⬅️ NEW IMPORT

import {
  getMyProfile,
  getUserProfile,
  updateUser,
  updateAvatar,
  getAllUsers,
} from "../controllers/userController.js";

const router = express.Router();

/* ============================================================
   ⚠️ ROUTE ORDER IMPORTANT
   "/all" and "/me" MUST come before "/:id"
============================================================ */

// 🔹 Get all users
router.get("/all", protect, getAllUsers);

// 🔹 Get logged-in user's profile
router.get("/me", protect, getMyProfile);

// 🔹 Get profile by ID
router.get("/:id", protect, getUserProfile);

// 🔹 Update text fields (bio/headline/about/location)
router.put("/update", protect, updateUser);

// 🔹 Update avatar using memory storage (Cloudinary ready)
router.put("/avatar", protect, memoryUpload.single("avatar"), updateAvatar);

export default router;
