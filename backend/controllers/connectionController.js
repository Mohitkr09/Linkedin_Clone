import mongoose from "mongoose";
import User from "../models/User.js";
import { sendNotification } from "../server.js";

// Validate ObjectId helper
const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/* ============================================================
   SEND CONNECTION REQUEST
============================================================ */
export const sendConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!validateObjectId(userId))
      return res.status(400).json({ message: "Invalid user id" });

    const sender = await User.findById(req.user._id);
    if (!sender) return res.status(404).json({ message: "Sender not found" });

    const receiver = await User.findById(userId);
    if (!receiver) return res.status(404).json({ message: "Receiver not found" });

    if (receiver.connections.includes(req.user._id))
      return res.status(400).json({ message: "Already connected" });

    if (receiver.connectionRequests.some((r) => r.from.equals(req.user._id)))
      return res.status(400).json({ message: "Request already sent" });

    receiver.connectionRequests.push({ from: req.user._id });

    receiver.notifications.push({
      message: `${sender.name} sent you a connection request`,
      type: "connection_request",
      fromUser: req.user._id,
      read: false,
      createdAt: new Date(),
    });

    await receiver.save();

    sendNotification(userId.toString(), {
      message: `${sender.name} sent you a connection request`,
      type: "connection_request",
      fromUser: {
        _id: sender._id,
        name: sender.name,
        avatar: sender.avatar || null,
      },
      createdAt: new Date(),
    });

    res.json({ message: "Connection request sent successfully" });
  } catch (error) {
    console.error("❌ Send request error:", error);
    res.status(500).json({ message: "Server error sending request" });
  }
};



/* ============================================================
   ACCEPT CONNECTION REQUEST
============================================================ */
export const acceptConnection = async (req, res) => {
  try {
    const { fromId } = req.params;

    if (!validateObjectId(fromId))
      return res.status(400).json({ message: "Invalid user id" });

    const receiver = await User.findById(req.user._id);
    const sender = await User.findById(fromId);

    if (!sender || !receiver)
      return res.status(404).json({ message: "User not found" });

    receiver.connectionRequests = receiver.connectionRequests.filter(
      (r) => !r.from.equals(fromId)
    );

    if (!receiver.connections.includes(fromId))
      receiver.connections.push(fromId);

    if (!sender.connections.includes(req.user._id))
      sender.connections.push(req.user._id);

    sender.notifications.push({
      message: `${receiver.name} accepted your connection request`,
      type: "connection_accepted",
      fromUser: req.user._id,
      read: false,
      createdAt: new Date(),
    });

    await receiver.save();
    await sender.save();

    sendNotification(fromId.toString(), {
      message: `${receiver.name} accepted your connection request`,
      type: "connection_accepted",
      fromUser: {
        _id: receiver._id,
        name: receiver.name,
        avatar: receiver.avatar || null,
      },
      createdAt: new Date(),
    });

    res.json({ message: "Connection accepted successfully" });
  } catch (error) {
    console.error("❌ Accept request error:", error);
    res.status(500).json({ message: "Server error accepting request" });
  }
};



/* ============================================================
   REJECT CONNECTION REQUEST
============================================================ */
export const rejectConnection = async (req, res) => {
  try {
    const { fromId } = req.params;

    const receiver = await User.findById(req.user._id);
    if (!receiver) return res.status(404).json({ message: "User not found" });

    receiver.connectionRequests = receiver.connectionRequests.filter(
      (r) => !r.from.equals(fromId)
    );

    await receiver.save();
    res.json({ message: "Connection request rejected" });
  } catch (error) {
    console.error("❌ Reject request error:", error);
    res.status(500).json({ message: "Server error rejecting request" });
  }
};



/* ============================================================
   🚀 CANCEL SENT REQUEST (NEW)
============================================================ */
export const cancelConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.params; // receiver ID
    const senderId = req.user._id;

    if (!validateObjectId(userId))
      return res.status(400).json({ message: "Invalid user id" });

    const receiver = await User.findById(userId);
    if (!receiver) return res.status(404).json({ message: "Receiver not found" });

    const exists = receiver.connectionRequests.some((r) =>
      r.from.equals(senderId)
    );

    if (!exists)
      return res.status(400).json({ message: "No pending request to cancel" });

    // Remove request
    receiver.connectionRequests = receiver.connectionRequests.filter(
      (r) => !r.from.equals(senderId)
    );

    // Remove related notification
    receiver.notifications = receiver.notifications.filter(
      (n) =>
        !(
          n.type === "connection_request" &&
          n.fromUser?.toString() === senderId.toString()
        )
    );

    await receiver.save();
    res.json({ message: "Connection request cancelled successfully" });
  } catch (error) {
    console.error("❌ Cancel request error:", error);
    res.status(500).json({ message: "Server error cancelling request" });
  }
};



/* ============================================================
   GET PENDING REQUESTS
============================================================ */
export const getPendingRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "connectionRequests.from",
      "name avatar headline"
    );
    res.json(user.connectionRequests);
  } catch (error) {
    console.error("❌ Get pending requests error:", error);
    res.status(500).json({ message: "Server error fetching requests" });
  }
};



/* ============================================================
   GET NOTIFICATIONS
============================================================ */
export const getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("notifications.fromUser", "name avatar")
      .select("notifications");

    const sorted = user.notifications.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json(sorted);
  } catch (error) {
    console.error("❌ Notifications error:", error);
    res.status(500).json({ message: "Server error fetching notifications" });
  }
};



/* ============================================================
   MARK ALL AS READ
============================================================ */
export const markNotificationsAsRead = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.notifications.forEach((n) => (n.read = true));
    await user.save();

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("❌ Mark read error:", error);
    res.status(500).json({ message: "Server error marking notifications" });
  }
};



/* ============================================================
   GET SENT REQUESTS
============================================================ */
export const getSentRequests = async (req, res) => {
  try {
    const users = await User.find({
      "connectionRequests.from": req.user._id,
    }).select("name avatar headline _id");

    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Sent requests error:", error);
    res.status(500).json({ message: "Server error fetching sent requests" });
  }
};
