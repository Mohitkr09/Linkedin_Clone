import React, { useEffect, useState } from "react";
import API from "../api";
import { Loader2, Check, X } from "lucide-react";

export default function Network() {
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ========================================================
     ✅ Fetch requests + notifications safely
  ======================================================== */
  const fetchData = async () => {
    try {
      const [reqRes, notifRes] = await Promise.all([
        API.get("/connections/requests"),
        API.get("/connections/notifications"),
      ]);

      // ✅ Handle both possible backend shapes:
      const reqData = Array.isArray(reqRes.data)
        ? reqRes.data
        : reqRes.data.requests || [];

      const notifData = Array.isArray(notifRes.data)
        ? notifRes.data
        : notifRes.data.notifications || [];

      setRequests(reqData || []);
      setNotifications(notifData || []);
    } catch (err) {
      console.error("❌ Fetch notifications error:", err);
      setRequests([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ========================================================
     ✅ Accept / Reject Connection
  ======================================================== */
  const handleAccept = async (id) => {
    try {
      await API.put(`/connections/accept/${id}`);
      setRequests((prev) => prev.filter((r) => r.from._id !== id));
      fetchData();
    } catch (err) {
      console.error("❌ Accept request failed:", err);
    }
  };

  const handleReject = async (id) => {
    try {
      await API.put(`/connections/reject/${id}`);
      setRequests((prev) => prev.filter((r) => r.from._id !== id));
    } catch (err) {
      console.error("❌ Reject request failed:", err);
    }
  };

  /* ========================================================
     ✅ Loading State
  ======================================================== */
  if (loading) {
    return (
      <div className="flex justify-center mt-10 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  /* ========================================================
     ✅ Render
  ======================================================== */
  return (
    <div className="bg-gray-50 min-h-screen flex justify-center py-8 px-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-md border p-5">
        <h2 className="text-xl font-semibold mb-4">Notifications</h2>

        {/* Connection Requests */}
        {Array.isArray(requests) && requests.length > 0 && (
          <div className="mb-5">
            <h3 className="text-gray-700 font-medium mb-2">
              Connection Requests
            </h3>
            {requests.map((r) => (
              <div
                key={r.from?._id || Math.random()}
                className="flex items-center justify-between border-b py-3"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={r.from?.avatar || "/default-avatar.png"}
                    alt="avatar"
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-semibold">{r.from?.name}</p>
                    <p className="text-xs text-gray-500">
                      {r.from?.headline || "LinkedIn Member"}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAccept(r.from?._id)}
                    className="bg-[#0A66C2] text-white px-3 py-1 rounded-full flex items-center gap-1 text-sm hover:bg-[#004182]"
                  >
                    <Check className="w-4 h-4" /> Accept
                  </button>
                  <button
                    onClick={() => handleReject(r.from?._id)}
                    className="bg-gray-200 px-3 py-1 rounded-full flex items-center gap-1 text-sm hover:bg-gray-300"
                  >
                    <X className="w-4 h-4" /> Ignore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Notifications */}
        <h3 className="text-gray-700 font-medium mb-2">Recent Activity</h3>

        {!Array.isArray(notifications) || notifications.length === 0 ? (
          <p className="text-gray-500 text-sm">No new notifications.</p>
        ) : (
          notifications.map((n, i) => (
            <div key={n._id || i} className="border-b py-2 text-sm text-gray-700">
              <p>{n.message}</p>
              <p className="text-xs text-gray-400">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
