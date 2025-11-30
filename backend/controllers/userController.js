import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import fs from "fs";
import path from "path";

/* =============================================
   👤 GET CURRENT USER PROFILE
============================================= */
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-passwordHash")
      .populate("followers", "name avatar headline")
      .populate("following", "name avatar headline");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ ...user._doc, _id: user._id });
  } catch (error) {
    console.error("❌ [Profile] Error:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
};

/* =============================================
   👤 GET USER BY ID
============================================= */
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id === "me" ? req.user._id : req.params.id;

    const user = await User.findById(userId)
      .select("-passwordHash")
      .populate("followers", "name avatar headline")
      .populate("following", "name avatar headline");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ ...user._doc, _id: user._id });
  } catch (error) {
    console.error("❌ [Profile] Error:", error);
    res.status(500).json({ message: "Error fetching user profile" });
  }
};

/* =============================================
   ✏️ UPDATE USER DETAILS
============================================= */
export const updateUser = async (req, res) => {
  try {
    const { bio, headline, about, location } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (bio !== undefined) user.bio = bio;
    if (headline !== undefined) user.headline = headline;
    if (about !== undefined) user.about = about;
    if (location !== undefined) user.location = location;

    const updated = await user.save();

    res.status(200).json({
      _id: updated._id,
      name: updated.name,
      avatar: updated.avatar,
      bio: updated.bio,
      headline: updated.headline,
      about: updated.about,
      location: updated.location,
      followers: updated.followers,
      following: updated.followers,
    });
  } catch (error) {
    console.error("❌ [Update] Error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

/* =============================================
   🖼 UPDATE USER AVATAR (CLOUDINARY)
============================================= */
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "CLONE/avatars" },
      async (err, result) => {
        if (err) {
          console.warn("⚠ Cloudinary failed, using local storage");
          const dest = `uploads/${user._id}_${Date.now()}.jpg`;
          fs.writeFileSync(dest, req.file.buffer);
          user.avatar = `http://localhost:5000/${dest}`;
        } else {
          user.avatar = result.secure_url;
        }

        await user.save();
        return res.status(200).json({ avatar: user.avatar });
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (error) {
    console.error("❌ [Avatar] Error:", error);
    res.status(500).json({ message: "Error updating avatar" });
  }
};

/* =============================================
   ❌ DELETE USER AVATAR
============================================= */
export const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.avatar)
      return res.status(400).json({ message: "No avatar to remove" });

    // If on Cloudinary, delete resource
    if (user.avatar.includes("cloudinary")) {
      const publicId = user.avatar.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`CLONE/avatars/${publicId}`);
      } catch (e) {
        console.warn("⚠ Cloudinary deletion failed");
      }
    }

    user.avatar = null;
    await user.save();

    return res.json({ message: "Avatar removed", avatar: null });
  } catch (error) {
    console.error("❌ [Delete Avatar] Error:", error);
    res.status(500).json({ message: "Could not delete avatar" });
  }
};

/* =============================================
   🤝 FOLLOW / UNFOLLOW
============================================= */
export const followUser = async (req, res) => { /* unchanged */ };
export const unfollowUser = async (req, res) => { /* unchanged */ };

/* =============================================
   🌐 GET ALL USERS
============================================= */
export const getAllUsers = async (req, res) => { /* unchanged */ };
