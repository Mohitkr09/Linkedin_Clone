import User from "../models/User.js";
import { sendNotification } from "../server.js";

// ✅ Send connection request
export const sendConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.params; // target user to connect
    const sender = await User.findById(req.user._id);
    const receiver = await User.findById(userId);

    if (!receiver) return res.status(404).json({ message: "User not found" });
    if (receiver.connectionRequests.some((r) => r.from.equals(req.user._id)))
      return res.status(400).json({ message: "Request already sent" });

    // Add request to receiver
    receiver.connectionRequests.push({ from: req.user._id });

    // Add notification in DB
    receiver.notifications.push({
      message: `${sender.name} sent you a connection request.`,
      type: "connection_request",
      fromUser: req.user._id,
      read: false,
      createdAt: new Date(),
    });

    await receiver.save();

    // 🔔 Send real-time notification
    sendNotification(userId.toString(), {
      message: `${sender.name} sent you a connection request.`,
      type: "connection_request",
      fromUser: {
        _id: sender._id,
        name: sender.name,
        avatar: sender.avatar,
      },
      createdAt: new Date(),
    });

    res.json({ message: "Connection request sent successfully." });
  } catch (error) {
    console.error("❌ Send request error:", error);
    res.status(500).json({ message: "Server error sending connection request" });
  }
};

// ✅ Accept connection request
export const acceptConnection = async (req, res) => {
  try {
    const { fromId } = req.params;
    const receiver = await User.findById(req.user._id);
    const sender = await User.findById(fromId);

    if (!sender || !receiver)
      return res.status(404).json({ message: "User not found" });

    // Remove pending request
    receiver.connectionRequests = receiver.connectionRequests.filter(
      (r) => !r.from.equals(fromId)
    );

    // Add each other as connections if not already connected
    if (!receiver.connections.includes(fromId))
      receiver.connections.push(fromId);
    if (!sender.connections.includes(req.user._id))
      sender.connections.push(req.user._id);

    // Add notification to sender
    sender.notifications.push({
      message: `${receiver.name} accepted your connection request.`,
      type: "connection_accepted",
      fromUser: req.user._id,
      read: false,
      createdAt: new Date(),
    });

    await receiver.save();
    await sender.save();

    // 🔔 Real-time notification to sender
    sendNotification(fromId.toString(), {
      message: `${receiver.name} accepted your connection request.`,
      type: "connection_accepted",
      fromUser: {
        _id: receiver._id,
        name: receiver.name,
        avatar: receiver.avatar,
      },
      createdAt: new Date(),
    });

    res.json({ message: "Connection accepted successfully." });
  } catch (error) {
    console.error("❌ Accept request error:", error);
    res.status(500).json({ message: "Server error accepting connection request" });
  }
};

// ✅ Reject connection request
export const rejectConnection = async (req, res) => {
  try {
    const { fromId } = req.params;
    const receiver = await User.findById(req.user._id);

    receiver.connectionRequests = receiver.connectionRequests.filter(
      (r) => !r.from.equals(fromId)
    );

    await receiver.save();
    res.json({ message: "Connection request rejected." });
  } catch (error) {
    console.error("❌ Reject request error:", error);
    res.status(500).json({ message: "Server error rejecting connection request" });
  }
};

// ✅ Get all pending requests
export const getPendingRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "connectionRequests.from",
      "name avatar headline"
    );
    res.json(user.connectionRequests);
  } catch (error) {
    console.error("❌ Get requests error:", error);
    res.status(500).json({ message: "Server error fetching requests" });
  }
};

// ✅ Get all notifications (sorted)
export const getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("notifications.fromUser", "name avatar")
      .select("notifications");

    // Sort latest first
    const sorted = user.notifications.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json(sorted);
  } catch (error) {
    console.error("❌ Notifications error:", error);
    res.status(500).json({ message: "Server error fetching notifications" });
  }
};

// ✅ Mark all notifications as read
export const markNotificationsAsRead = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.notifications.forEach((n) => (n.read = true));
    await user.save();

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("❌ Mark read error:", error);
    res.status(500).json({ message: "Server error marking notifications as read" });
  }
};
