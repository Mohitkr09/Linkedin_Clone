// backend/routes/userRoutes.js

import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.js";
import {
  getMyProfile,
  getUserProfile,
  updateUser,
  updateAvatar,
  getAllUsers,
} from "../controllers/userController.js";

const router = express.Router();

// 🔁 Multer config (store image in memory)
const upload = multer({ storage: multer.memoryStorage() });

/* ============================================================
   ⚠️ ROUTE ORDER IS IMPORTANT
   "/all" and "/me" MUST be above "/:id"
   OTHERWISE "/:id" captures them as params → undefined error
===============================================================*/

// 🔹 Get all users (network page)
router.get("/all", protect, getAllUsers);

// 🔹 Get logged-in user's profile
router.get("/me", protect, getMyProfile);

// 🔹 Get any user profile by ID
router.get("/:id", protect, getUserProfile);

// 🔹 Update user bio, headline, about
router.put("/update", protect, updateUser);

// 🔹 Update user avatar (profile picture)
router.put("/avatar", protect, upload.single("avatar"), updateAvatar);

export default router;
