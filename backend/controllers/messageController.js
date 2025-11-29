import Message from "../models/Message.js";
import User from "../models/User.js";
import { sendNotification } from "../server.js"; // optional real-time notify


export const sendMessage = async (req, res) => {
  try {
    const { to, text } = req.body;

    if (!to) return res.status(400).json({ message: "Receiver ID required" });
    if (!text || !text.trim())
      return res.status(400).json({ message: "Message cannot be empty" });

    // Fetch both users with connections
    const sender = await User.findById(req.user._id);
    const receiver = await User.findById(to);

    if (!receiver)
      return res.status(404).json({ message: "Receiver not found" });

    // 🔐 Check if connected (both sides)
    const isConnected =
      sender.connections.includes(receiver._id) &&
      receiver.connections.includes(sender._id);

    if (!isConnected) {
      return res.status(403).json({
        message: "You can only message users you are connected with",
      });
    }

    // Create message
    const message = await Message.create({
      sender: req.user._id,
      receiver: to,
      content: text.trim(),
    });

    // Optional: Real-time delivery (Socket.io)
    sendNotification(to.toString(), {
      type: "new_message",
      fromUser: sender._id,
      message: text.trim(),
      createdAt: new Date(),
    });

    res.status(201).json(message);
  } catch (error) {
    console.error("❌ Error sending message:", error);
    res.status(500).json({ message: "Server error sending message" });
  }
};

/* ============================================================
   GET CONVERSATION
============================================================ */
export const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;

    // Same connection rule here
    const me = await User.findById(req.user._id);
    const otherUser = await User.findById(userId);

    const isConnected =
      me.connections.includes(otherUser._id) &&
      otherUser.connections.includes(me._id);

    if (!isConnected) {
      return res.status(403).json({
        message: "You are not connected with this user",
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
    })
      .populate("sender receiver", "name avatar")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("❌ Get conversation error:", err);
    res.status(500).json({ message: "Server error fetching messages" });
  }
};

/* ============================================================
   GET RECENT CHATS (Only connected users)
============================================================ */
export const getRecentChats = async (req, res) => {
  try {
    const me = await User.findById(req.user._id);

    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    })
      .sort({ updatedAt: -1 })
      .populate("sender receiver", "name avatar headline");

    const chats = [];
    const seen = new Set();

    messages.forEach((msg) => {
      const partner =
        msg.sender._id.toString() === req.user._id.toString()
          ? msg.receiver
          : msg.sender;

      // Only push users who are connected
      if (
        me.connections.includes(partner._id) &&
        !seen.has(partner._id.toString())
      ) {
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
