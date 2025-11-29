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
    email: { type: String, unique: true, required: true },

    // This must match your auth controller:
    passwordHash: { type: String, required: true },

    avatar: String,
    headline: String,
    location: String,
    about: String,

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    connectionRequests: [connectionRequestSchema], // 👈 FIXED

    notifications: [notificationSchema], // 👈 FIXED
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
