import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import fs from "fs";
import path from "path";

/* ========================================================
   👤 USER PROFILE CONTROLLERS
======================================================== */

// ✅ Get current logged-in user's profile
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("followers", "name avatar headline")
      .populate("following", "name avatar headline");

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    console.error("❌ [Profile] Error fetching current user:", error);
    res
      .status(500)
      .json({ message: "Server error fetching current user profile" });
  }
};

// ✅ Get another user's profile by ID
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("followers", "name avatar headline")
      .populate("following", "name avatar headline");

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    console.error("❌ [Profile] Error fetching user profile:", error);
    res
      .status(500)
      .json({ message: "Server error fetching user profile" });
  }
};

// ✅ Update user details (bio, headline, location, about)
export const updateUser = async (req, res) => {
  try {
    const { bio, headline, location, about } = req.body;
    const user = await User.findById(req.user._id);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (bio !== undefined) user.bio = bio;
    if (headline !== undefined) user.headline = headline;
    if (location !== undefined) user.location = location;
    if (about !== undefined) user.about = about;

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      headline: updatedUser.headline,
      location: updatedUser.location,
      about: updatedUser.about,
      followers: updatedUser.followers,
      following: updatedUser.following,
    });
  } catch (error) {
    console.error("❌ [Profile] Error updating user:", error);
    res.status(500).json({ message: "Server error updating user" });
  }
};

/* ========================================================
   🖼️ UPDATE PROFILE AVATAR (Cloudinary + Fallback)
======================================================== */
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No file uploaded" });

    const user = await User.findById(req.user._id);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    // ✅ Cloudinary upload as a stream (no temp files)
    const uploadToCloudinary = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "linkedin_clone/avatars",
            resource_type: "image",
            timeout: 60000,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

    let uploadResponse;
    try {
      uploadResponse = await uploadToCloudinary();
    } catch (cloudErr) {
      console.error("⚠️ [Cloudinary] Upload failed, fallback:", cloudErr);

      // ✅ Local fallback upload
      const uploadsDir = path.resolve("uploads");
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

      const filePath = path.join(
        uploadsDir,
        `${user._id}_${Date.now()}_${req.file.originalname}`
      );

      fs.writeFileSync(filePath, req.file.buffer);

      // Build a URL based on deployment
      const baseUrl =
        process.env.NODE_ENV === "production"
          ? process.env.FRONTEND_URL || "https://yourdomain.com"
          : "http://localhost:5000";

      user.avatar = `${baseUrl}/${filePath.replace(/\\/g, "/")}`;
      await user.save();

      return res.status(200).json({
        avatar: user.avatar,
        message: "⚠️ Uploaded locally (Cloudinary failed)",
      });
    }

    user.avatar = uploadResponse.secure_url;
    await user.save();

    res.status(200).json({ avatar: user.avatar });
  } catch (error) {
    console.error("❌ [Avatar] Error updating avatar:", error);
    res.status(500).json({ message: "Failed to update avatar" });
  }
};

/* ========================================================
   🤝 FOLLOW / UNFOLLOW CONTROLLERS
======================================================== */

// ✅ Follow a user
export const followUser = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const targetId = req.params.id.toString();

    if (userId === targetId)
      return res
        .status(400)
        .json({ message: "You can't follow yourself." });

    const [user, target] = await Promise.all([
      User.findById(userId),
      User.findById(targetId),
    ]);

    if (!target)
      return res.status(404).json({ message: "User not found." });

    if (user.following.includes(targetId))
      return res
        .status(400)
        .json({ message: "Already following this user." });

    user.following.push(targetId);
    target.followers.push(userId);

    await Promise.all([user.save(), target.save()]);

    res.json({
      message: `You followed ${target.name}`,
      targetId,
      followersCount: target.followers.length,
    });
  } catch (error) {
    console.error("❌ [Follow] Error:", error);
    res
      .status(500)
      .json({ message: "Server error while following user." });
  }
};

// ✅ Unfollow a user
export const unfollowUser = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const targetId = req.params.id.toString();

    if (userId === targetId)
      return res
        .status(400)
        .json({ message: "You can't unfollow yourself." });

    const [user, target] = await Promise.all([
      User.findById(userId),
      User.findById(targetId),
    ]);

    if (!target)
      return res.status(404).json({ message: "User not found." });

    user.following = user.following.filter((id) => id.toString() !== targetId);
    target.followers = target.followers.filter((id) => id.toString() !== userId);

    await Promise.all([user.save(), target.save()]);

    res.json({
      message: `You unfollowed ${target.name}`,
      targetId,
      followersCount: target.followers.length,
    });
  } catch (error) {
    console.error("❌ [Unfollow] Error:", error);
    res
      .status(500)
      .json({ message: "Server error while unfollowing user." });
  }
};

// ✅ Get followers & following lists
export const getFollowData = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("followers", "name avatar headline")
      .populate("following", "name avatar headline");

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      followers: user.followers,
      following: user.following,
    });
  } catch (error) {
    console.error("❌ [FollowData] Error:", error);
    res
      .status(500)
      .json({ message: "Server error fetching follow data." });
  }
};

/* ========================================================
   🌐 GET ALL USERS (for Network Page)
======================================================== */
// ✅ Get all users except the current logged-in one
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("_id name headline avatar connections followers following");

    if (!users || users.length === 0) {
      return res.status(200).json([]); // return empty array, not an error
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("❌ [Users] Fetch error:", error);
    res.status(500).json({ message: "Server error fetching users" });
  }
};


