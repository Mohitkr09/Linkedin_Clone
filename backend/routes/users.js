// backend/routes/userRoutes.js

import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.js";
import {
  getMyProfile,
  getUserProfile,
  updateUser,
  updateAvatar,
  deleteAvatar,      // ⬅️ IMPORT DELETE
  getAllUsers,
} from "../controllers/userController.js";

const router = express.Router();

// Multer config (store file in memory for Cloudinary upload)
const upload = multer({ storage: multer.memoryStorage() });

/* ============================================================
   ROUTE ORDER IS IMPORTANT
   "/all" and "/me" MUST be above "/:id"
============================================================ */

// 🔹 Get all users
router.get("/all", protect, getAllUsers);

// 🔹 Get logged-in profile
router.get("/me", protect, getMyProfile);

// 🔹 Get user by ID
router.get("/:id", protect, getUserProfile);

// 🔹 Update user profile data (bio, headline, about)
router.put("/update", protect, updateUser);

// 🔹 Update avatar (upload new profile picture)
router.put("/avatar", protect, upload.single("avatar"), updateAvatar);

// 🔻 Delete avatar (remove profile picture)
router.delete("/avatar", protect, deleteAvatar);   // ⭐ REQUIRED

export default router;
