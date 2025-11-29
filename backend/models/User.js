import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { type: String, required: true }, // connection_request | connection_accepted
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const connectionRequestSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },

    // 🔐 Matches your auth controller
    passwordHash: { type: String, required: true },

    avatar: { type: String, default: null },
    headline: { type: String, default: "" },   // 🆕 ensures no undefined
    location: { type: String, default: "" },
    
    // 🆕 Added this field (your UI expects it!)
    bio: { type: String, default: "" },

    // 'about' remains separate for detailed profile section
    about: { type: String, default: "" },

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // pending requests
    connectionRequests: [connectionRequestSchema],

    // notifications system
    notifications: [notificationSchema],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
