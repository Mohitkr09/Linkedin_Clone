import React, { useEffect, useState } from "react";
import API from "../api";
import { Loader2, UserPlus, Check, X } from "lucide-react";

export default function Notifications() {
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [reqRes, notifRes] = await Promise.all([
        API.get("/connections/requests"),
        API.get("/connections/notifications"),
      ]);
      setRequests(reqRes.data);
      setNotifications(notifRes.data);
    } catch (err) {
      console.error("❌ Fetch notifications error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAccept = async (id) => {
    await API.put(`/connections/accept/${id}`);
    setRequests((prev) => prev.filter((r) => r.from._id !== id));
    fetchData();
  };

  const handleReject = async (id) => {
    await API.put(`/connections/reject/${id}`);
    setRequests((prev) => prev.filter((r) => r.from._id !== id));
  };

  if (loading)
    return (
      <div className="flex justify-center mt-10 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );

  return (
    <div className="bg-gray-50 min-h-screen flex justify-center py-8 px-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-md border p-5">
        <h2 className="text-xl font-semibold mb-4">Notifications</h2>

        {requests.length > 0 && (
          <div className="mb-5">
            <h3 className="text-gray-700 font-medium mb-2">
              Connection Requests
            </h3>
            {requests.map((r) => (
              <div
                key={r.from._id}
                className="flex items-center justify-between border-b py-3"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={r.from.avatar || "/default-avatar.png"}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-semibold">{r.from.name}</p>
                    <p className="text-xs text-gray-500">
                      {r.from.headline || "LinkedIn Member"}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAccept(r.from._id)}
                    className="bg-[#0A66C2] text-white px-3 py-1 rounded-full flex items-center gap-1 text-sm hover:bg-[#004182]"
                  >
                    <Check className="w-4 h-4" /> Accept
                  </button>
                  <button
                    onClick={() => handleReject(r.from._id)}
                    className="bg-gray-200 px-3 py-1 rounded-full flex items-center gap-1 text-sm hover:bg-gray-300"
                  >
                    <X className="w-4 h-4" /> Ignore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <h3 className="text-gray-700 font-medium mb-2">Recent Activity</h3>
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-sm">No new notifications.</p>
        ) : (
          notifications.map((n, i) => (
            <div key={i} className="border-b py-2 text-sm text-gray-700">
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
