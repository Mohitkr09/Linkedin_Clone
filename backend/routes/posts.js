import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.js";
import {
  createPost,
  getAllPosts,
  getUserPosts,
  likePost,
  commentOnPost,
  updatePost,
  deletePost,
  sharePost,
} from "../controllers/postController.js";

const router = express.Router();

/* ---------------------------- 🧠 MULTER CONFIG ---------------------------- */
// Memory storage (uploads directly to Cloudinary, no temp file)
const storage = multer.memoryStorage();

// Accept only image/video files up to 100MB
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
  fileFilter: (req, file, cb) => {
    const isValid =
      file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/");
    if (isValid) cb(null, true);
    else cb(new Error("Only image and video uploads are allowed"));
  },
});

/* ---------------------------- 🧩 POST ROUTES ---------------------------- */

/**
 * @route   POST /api/posts
 * @desc    Create a new post (text + optional image/video)
 * @access  Private
 */
router.post("/", protect, upload.single("file"), createPost);

/**
 * @route   GET /api/posts
 * @desc    Get all posts (feed)
 * @access  Private
 */
router.get("/", protect, getAllPosts);

/**
 * @route   GET /api/posts/user/:userId
 * @desc    Get all posts by a specific user
 * @access  Private
 */
router.get("/user/:userId", protect, getUserPosts);

/**
 * @route   PUT /api/posts/:id/like
 * @desc    Like or unlike a post
 * @access  Private
 */
router.put("/:id/like", protect, likePost);

/**
 * @route   POST /api/posts/:id/comment
 * @desc    Add a comment to a post
 * @access  Private
 */
router.post("/:id/comment", protect, commentOnPost);

/**
 * @route   PUT /api/posts/:id
 * @desc    Edit post content or replace image/video
 * @access  Private (only owner)
 */
router.put("/:id", protect, upload.single("file"), updatePost);

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post (and remove Cloudinary media)
 * @access  Private (only owner)
 */
router.delete("/:id", protect, deletePost);
router.post("/:id/share", protect, sharePost);


/* ---------------------------- 🧾 EXPORT --------------------------- */
export default router;
