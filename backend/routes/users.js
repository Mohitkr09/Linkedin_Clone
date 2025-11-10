import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.js";
import {
  getMyProfile,
  getUserProfile,
  updateUser,
  updateAvatar,
} from "../controllers/userController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/me", protect, getMyProfile);
router.get("/:id", protect, getUserProfile);
router.put("/update", protect, updateUser);
router.put("/avatar", protect, upload.single("avatar"), updateAvatar);

export default router;
