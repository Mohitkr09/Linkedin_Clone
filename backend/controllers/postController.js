import Post from "../models/Post.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

/* =========================================================
   📝 Create a new post
========================================================= */
export const createPost = async (req, res) => {
  try {
    const { content, visibility } = req.body;

    if (!content && !req.file) {
      return res.status(400).json({ message: "Post must have text or media." });
    }

    let uploadUrl = null;
    let uploadId = null;
    let fileType = null;

    // ✅ Upload to Cloudinary (if file exists)
    if (req.file) {
      const fileBase64 = req.file.buffer.toString("base64");
      const dataUri = `data:${req.file.mimetype};base64,${fileBase64}`;

      const uploadRes = await cloudinary.uploader.upload(dataUri, {
        folder: "linkedin_clone/posts",
        resource_type: "auto",
        transformation: [
          { quality: "auto", fetch_format: "auto" },
          { width: 1080, crop: "limit" },
        ],
      });

      uploadUrl = uploadRes.secure_url;
      uploadId = uploadRes.public_id;
      fileType = req.file.mimetype.startsWith("video") ? "video" : "image";
    }

    const newPost = await Post.create({
      user: req.user._id,
      content,
      visibility: visibility || "public",
      image: fileType === "image" ? uploadUrl : null,
      video: fileType === "video" ? uploadUrl : null,
      imageId: fileType === "image" ? uploadId : null,
      videoId: fileType === "video" ? uploadId : null,
    });

    const populatedPost = await newPost.populate("user", "name avatar headline");

    // ✅ Return post directly (not wrapped)
    res.status(201).json(populatedPost);
  } catch (error) {
    console.error("❌ Error creating post:", error);
    res.status(500).json({ message: "Server error creating post" });
  }
};

/* =========================================================
   🔍 Get all posts (Feed)
========================================================= */
export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "name avatar headline")
      .populate("comments.user", "name avatar headline")
      .sort({ createdAt: -1 });

    // ✅ Return array directly
    res.status(200).json(posts);
  } catch (error) {
    console.error("❌ Error fetching posts:", error);
    res.status(500).json({ message: "Server error fetching posts" });
  }
};

/* =========================================================
   👤 Get posts by specific user
========================================================= */
export const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .populate("user", "name avatar headline")
      .populate("comments.user", "name avatar headline")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    console.error("❌ Error fetching user posts:", error);
    res.status(500).json({ message: "Server error fetching user posts" });
  }
};

/* =========================================================
   ❤️ Like / Unlike post
========================================================= */
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id;
    const hasLiked = post.likes.includes(userId);

    if (hasLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
    }

    await post.save();

    res.status(200).json({
      message: hasLiked ? "Post unliked" : "Post liked",
      postId: post._id,
      likes: post.likes,
      likeCount: post.likes.length,
    });
  } catch (error) {
    console.error("❌ Like error:", error);
    res.status(500).json({ message: "Server error liking post" });
  }
};

/* =========================================================
   💬 Comment on post
========================================================= */
export const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Comment cannot be empty" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ user: req.user._id, text });
    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate("user", "name avatar headline")
      .populate("comments.user", "name avatar headline");

    // ✅ Return post directly
    res.status(200).json(populatedPost);
  } catch (error) {
    console.error("❌ Comment error:", error);
    res.status(500).json({ message: "Server error adding comment" });
  }
};

/* =========================================================
   ✏️ Update post
========================================================= */
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Only owner can edit
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized to edit this post" });
    }

    let uploadUrl = post.image || post.video;
    let uploadId = post.imageId || post.videoId;
    let resourceType = post.image ? "image" : post.video ? "video" : null;

    // ✅ Replace media if a new file is uploaded
    if (req.file) {
      if (uploadId) {
        await cloudinary.uploader.destroy(uploadId, {
          resource_type: resourceType || "auto",
        });
      }

      const fileBase64 = req.file.buffer.toString("base64");
      const dataUri = `data:${req.file.mimetype};base64,${fileBase64}`;

      const uploadRes = await cloudinary.uploader.upload(dataUri, {
        folder: "linkedin_clone/posts",
        resource_type: "auto",
        transformation: [
          { quality: "auto", fetch_format: "auto" },
          { width: 1080, crop: "limit" },
        ],
      });

      uploadUrl = uploadRes.secure_url;
      uploadId = uploadRes.public_id;
      resourceType = req.file.mimetype.startsWith("video") ? "video" : "image";
    }

    // ✅ Update fields
    post.content = content?.trim() || post.content;
    post.image = resourceType === "image" ? uploadUrl : null;
    post.video = resourceType === "video" ? uploadUrl : null;
    post.imageId = resourceType === "image" ? uploadId : null;
    post.videoId = resourceType === "video" ? uploadId : null;

    const updated = await post.save();

    const populatedPost = await Post.findById(updated._id)
      .populate("user", "name avatar headline")
      .populate("comments.user", "name avatar headline");

    // ✅ Return post directly
    res.status(200).json(populatedPost);
  } catch (error) {
    console.error("❌ Update Post Error:", error);
    res.status(500).json({ message: "Server error updating post" });
  }
};

/* =========================================================
   ❌ Delete post
========================================================= */
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized to delete this post" });
    }

    // ✅ Delete media if exists
    if (post.imageId)
      await cloudinary.uploader.destroy(post.imageId, { resource_type: "image" });
    if (post.videoId)
      await cloudinary.uploader.destroy(post.videoId, { resource_type: "video" });

    await post.deleteOne();

    res.status(200).json({ message: "Post deleted successfully", postId: post._id });
  } catch (error) {
    console.error("❌ Delete Post Error:", error);
    res.status(500).json({ message: "Server error deleting post" });
  }
};

/* =========================================================
   🔁 Share a post
========================================================= */
export const sharePost = async (req, res) => {
  try {
    const originalPost = await Post.findById(req.params.id).populate(
      "user",
      "name avatar headline"
    );
    if (!originalPost) return res.status(404).json({ message: "Post not found" });

    const sharedPost = await Post.create({
      user: req.user._id,
      content: originalPost.content,
      image: originalPost.image,
      video: originalPost.video,
      sharedFrom: originalPost._id,
    });

    originalPost.shareCount = (originalPost.shareCount || 0) + 1;
    await originalPost.save();

    const populatedShared = await sharedPost.populate("user", "name avatar headline");

    // ✅ Return new shared post directly
    res.status(201).json(populatedShared);
  } catch (error) {
    console.error("❌ Share Post Error:", error);
    res.status(500).json({ message: "Server error sharing post" });
  }
};
