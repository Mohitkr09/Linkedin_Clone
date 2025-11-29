import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

// 🔐 Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

/* ============================================================
   REGISTER NEW USER
============================================================ */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // 👇 IMPORTANT: store in `passwordHash` field, NOT `password`
    const user = await User.create({
      name,
      email,
      passwordHash: hashed,
    });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || null,
      token: generateToken(user._id),
      message: "Registration successful",
    });
  } catch (error) {
    console.error("❌ Register Error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

/* ============================================================
   LOGIN USER
============================================================ */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });

    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    // 👇 Compare with `passwordHash`
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || null,
      token: generateToken(user._id),
      message: "Login successful",
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};
