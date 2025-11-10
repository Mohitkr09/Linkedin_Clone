import Message from "../models/Message.js";
import User from "../models/User.js";
import { sendNotification } from "../server.js"; // reuse your Socket.io system

// ✅ Send a message
export const sendMessage = async (req, res) => {
  try {
    const { to, text } = req.body;

    console.log("📥 Received message request:", req.body);

    if (!to) {
      return res.status(400).json({ message: "Receiver ID is required" });
    }

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    // ✅ Create the message using correct schema fields
    const message = await Message.create({
      sender: req.user._id, // authenticated user
      receiver: to,
      content: text.trim(),
    });

    res.status(201).json(message);
  } catch (error) {
    console.error("❌ Error sending message:", error);
    res.status(500).json({ message: "Server error while sending message" });
  }
};

// ✅ Get conversation between two users
export const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
    })
      .populate("sender", "name avatar")
      .populate("receiver", "name avatar")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("❌ Get conversation error:", err);
    res.status(500).json({ message: "Server error fetching messages" });
  }
};

// ✅ Get recent chats (like LinkedIn’s left chat list)
export const getRecentChats = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    })
      .sort({ updatedAt: -1 })
      .populate("sender receiver", "name avatar headline");

    // Extract unique chat partners
    const chats = [];
    const seen = new Set();

    messages.forEach((msg) => {
      const partner =
        msg.sender._id.toString() === req.user._id.toString()
          ? msg.receiver
          : msg.sender;

      if (!seen.has(partner._id.toString())) {
        seen.add(partner._id.toString());
        chats.push(partner);
      }
    });

    res.json(chats);
  } catch (err) {
    console.error("❌ Get chats error:", err);
    res.status(500).json({ message: "Server error fetching chats" });
  }
};
