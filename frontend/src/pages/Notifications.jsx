import React, { useEffect, useState, useRef } from "react";
import API from "../api";
import { Loader2, Check, X, Bell } from "lucide-react";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";

export default function Notifications({ onClearCount }) {
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useRef(null);
  const user = JSON.parse(localStorage.getItem("user"));

  /* ========================================================
     ✅ Fetch connection requests & notifications safely
  ======================================================== */
  const fetchData = async () => {
    try {
      const [reqRes, notifRes] = await Promise.all([
        API.get("/connections/requests"),
        API.get("/connections/notifications"),
      ]);

      // ✅ Handle both array and object formats
      const reqData = Array.isArray(reqRes.data)
        ? reqRes.data
        : reqRes.data.requests || [];

      const notifData = Array.isArray(notifRes.data)
        ? notifRes.data
        : notifRes.data.notifications || [];

      setRequests(reqData || []);
      setNotifications(notifData || []);
    } catch (err) {
      console.error("❌ Fetch notifications failed:", err);
      setRequests([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  /* ========================================================
     ✅ Mark all notifications as read
  ======================================================== */
  const markAsRead = async () => {
    try {
      await API.put("/connections/notifications/read");
      if (onClearCount) onClearCount(); // notify NavBar
    } catch (err) {
      console.error("❌ Mark as read failed:", err);
    }
  };

  /* ========================================================
     ✅ Accept & Reject Requests
  ======================================================== */
  const handleAccept = async (fromId) => {
    try {
      await API.put(`/connections/accept/${fromId}`);
      setRequests((prev) => prev.filter((r) => r.from._id !== fromId));
      toast.success("✅ Connection accepted!");
      fetchData();
    } catch (err) {
      console.error("❌ Accept error:", err.response?.data || err);
      toast.error("Failed to accept connection");
    }
  };

  const handleReject = async (fromId) => {
    try {
      await API.put(`/connections/reject/${fromId}`);
      setRequests((prev) => prev.filter((r) => r.from._id !== fromId));
      toast("Connection request ignored", { icon: "🙅‍♂️" });
    } catch (err) {
      console.error("❌ Reject error:", err.response?.data || err);
      toast.error("Failed to reject request");
    }
  };

  /* ========================================================
     ✅ Socket.IO Real-time Listener
  ======================================================== */
  useEffect(() => {
    if (!user?._id) return;

    // Use backend URL (works in dev & prod)
    const socketURL =
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_API_URL?.replace("/api", "") ||
      "http://localhost:5000";

    socket.current = io(socketURL, {
      transports: ["websocket"],
      reconnection: true,
    });

    socket.current.emit("registerUser", user._id);

    socket.current.on("newNotification", (data) => {
      console.log("🔔 Live notification:", data);

      toast.success(data.message, {
        icon: "🔔",
        duration: 4000,
        style: {
          background: "#f0f9ff",
          border: "1px solid #bae6fd",
          color: "#0A66C2",
        },
      });

      setNotifications((prev) => [
        { ...data, read: false, createdAt: new Date() },
        ...prev,
      ]);
    });

    return () => socket.current.disconnect();
  }, [user?._id]);

  /* ========================================================
     ✅ Initial Fetch + Mark Read
  ======================================================== */
  useEffect(() => {
    fetchData();
    markAsRead();
  }, []);

  /* ========================================================
     ✅ Loading Spinner
  ======================================================== */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  /* ========================================================
     ✅ Render UI
  ======================================================== */
  return (
    <div className="bg-gray-50 min-h-screen flex justify-center py-10 px-4">
      <Toaster position="top-right" />
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border p-6 transition-all">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#0A66C2]" /> Notifications
          </h1>
          <button
            onClick={markAsRead}
            className="text-sm text-[#0A66C2] hover:underline"
          >
            Mark all as read
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Stay updated with your network’s latest activities and connection
          updates.
        </p>

        {/* 🔗 Connection Requests */}
        {Array.isArray(requests) && requests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-800 mb-3">
              Connection Requests
            </h2>
            <div className="space-y-3">
              {requests.map((r) => (
                <div
                  key={r.from?._id || Math.random()}
                  className="flex items-center justify-between border rounded-lg p-3 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={r.from?.avatar || "/default-avatar.png"}
                      alt={r.from?.name}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {r.from?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {r.from?.headline || "LinkedIn Member"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(r.from?._id)}
                      className="bg-[#0A66C2] text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1 hover:bg-[#004182] transition"
                    >
                      <Check className="w-4 h-4" /> Accept
                    </button>
                    <button
                      onClick={() => handleReject(r.from?._id)}
                      className="bg-gray-200 text-gray-800 px-3 py-1.5 rounded-full text-sm flex items-center gap-1 hover:bg-gray-300 transition"
                    >
                      <X className="w-4 h-4" /> Ignore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🕓 General Notifications */}
        <div>
          <h2 className="text-lg font-medium text-gray-800 mb-3">
            Recent Activity
          </h2>
          {!Array.isArray(notifications) || notifications.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No new notifications right now.
            </p>
          ) : (
            <div className="space-y-2">
              {notifications.map((n, i) => (
                <div
                  key={n._id || i}
                  className={`flex items-start gap-3 p-3 border rounded-lg text-sm transition ${
                    n.read ? "bg-white" : "bg-blue-50"
                  }`}
                >
                  <img
                    src={n.fromUser?.avatar || "/default-avatar.png"}
                    alt="sender"
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-gray-800 leading-snug">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
