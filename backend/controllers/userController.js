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

    res.status(200).json({
      ...user._doc,
      _id: user._id, // ensure _id always present
    });
  } catch (error) {
    console.error("❌ [Profile] Error:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
};

/* =============================================
   👤 GET USER BY ID (supports "me")
============================================= */
export const getUserProfile = async (req, res) => {
  try {
    const userId =
      req.params.id === "me" || !req.params.id ? req.user._id : req.params.id;

    const user = await User.findById(userId)
      .select("-passwordHash")
      .populate("followers", "name avatar headline")
      .populate("following", "name avatar headline");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      ...user._doc,
      _id: user._id,
    });
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
      following: updated.following,
    });
  } catch (error) {
    console.error("❌ [Update] Error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

/* =============================================
   🖼 UPDATE USER AVATAR (Cloudinary)
============================================= */
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const uploadToCloudinary = () =>
      new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "CLONE/avatars" },
          (err, result) => (err ? reject(err) : resolve(result))
        );
        streamifier.createReadStream(req.file.buffer).pipe(
          cloudinary.uploader.upload_stream(
            { folder: "CLONE/avatars" },
            (err, result) => (err ? reject(err) : resolve(result))
          )
        );
      });

    let uploaded;
    try {
      uploaded = await uploadToCloudinary();
      user.avatar = uploaded.secure_url;
    } catch {
      console.warn("⚠ Cloudinary failed, using local storage");
      const dest = path.join("uploads", `${user._id}_${Date.now()}.jpg`);
      fs.writeFileSync(dest, req.file.buffer);
      user.avatar = `http://localhost:5000/${dest}`;
    }

    await user.save();
    res.status(200).json({ avatar: user.avatar });
  } catch (error) {
    console.error("❌ [Avatar] Error:", error);
    res.status(500).json({ message: "Error updating avatar" });
  }
};

/* =============================================
   🤝 FOLLOW / UNFOLLOW
============================================= */
export const followUser = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id)
      return res.status(400).json({ message: "You cannot follow yourself" });

    const target = await User.findById(req.params.id);
    const user = await User.findById(req.user._id);

    if (!target) return res.status(404).json({ message: "User not found" });
    if (user.following.includes(req.params.id))
      return res.status(400).json({ message: "Already following user" });

    user.following.push(target._id);
    target.followers.push(user._id);

    await user.save();
    await target.save();

    res.json({ message: "Followed", followers: target.followers.length });
  } catch (e) {
    res.status(500).json({ message: "Follow failed" });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const target = await User.findById(req.params.id);

    user.following = user.following.filter((id) => id.toString() !== req.params.id);
    target.followers = target.followers.filter((id) => id.toString() !== req.user._id);

    await user.save();
    await target.save();

    res.json({ message: "Unfollowed", followers: target.followers.length });
  } catch {
    res.status(500).json({ message: "Unfollow failed" });
  }
};

/* =============================================
   🌐 GET ALL USERS
============================================= */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select(
      "_id name headline avatar followers following"
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error loading users" });
  }
};
