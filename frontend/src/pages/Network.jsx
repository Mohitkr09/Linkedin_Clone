import React, { useEffect, useState } from "react";
import API from "../api";
import { Loader2, Check, X, UserPlus, Undo2 } from "lucide-react";
import toast from "react-hot-toast";

export default function Network() {
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));

  /* ========================================================
     FETCH ALL NETWORK DATA
  ======================================================== */
  const fetchData = async () => {
    try {
      const [reqRes, notifRes, usersRes, sentRes, meRes] = await Promise.all([
        API.get("/connections/requests"),
        API.get("/connections/notifications"),
        API.get("/users/all"),
        API.get("/connections/sent"),
        API.get("/users/me"),
      ]);

      setRequests(reqRes.data || []);
      setNotifications(notifRes.data || []);
      setAllUsers(usersRes.data || []);
      setSentRequests(sentRes.data.map((u) => u._id));
      setConnections((meRes.data.connections || []).map((c) =>
        typeof c === "string" ? c : c._id
      ));
    } catch (err) {
      console.error("❌ Fetch network data error:", err);
      toast.error("Failed to load network data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ========================================================
     CONNECTION ACTIONS
  ======================================================== */
  const handleAccept = async (id) => {
    try {
      await API.put(`/connections/accept/${id}`);
      toast.success("Connection accepted!");
      setRequests((prev) => prev.filter((r) => r.from._id !== id));
      setConnections((prev) => [...prev, id]);
    } catch (err) {
      toast.error("Failed to accept connection.");
    }
  };

  const handleReject = async (id) => {
    try {
      await API.put(`/connections/reject/${id}`);
      toast("Request ignored.", { icon: "🚫" });
      setRequests((prev) => prev.filter((r) => r.from._id !== id));
    } catch (err) {
      toast.error("Failed to reject request.");
    }
  };

  const handleConnect = async (id) => {
    try {
      await API.post(`/connections/request/${id}`);
      toast.success("Connection request sent!");
      setSentRequests((prev) => [...prev, id]);
    } catch (err) {
      toast.error("Failed to send request.");
    }
  };

  /* ========================================================
     CANCEL SENT REQUEST  (NEW)
  ======================================================== */
  const handleCancelRequest = async (id) => {
    try {
      await API.delete(`/connections/request/cancel/${id}`);
      toast.success("Request cancelled");

      setSentRequests((prev) => prev.filter((u) => u !== id));
    } catch (err) {
      console.error("❌ Cancel request failed:", err);
      toast.error("Failed to cancel request.");
    }
  };

  /* ========================================================
     LOADING SPINNER
  ======================================================== */
  if (loading) {
    return (
      <div className="flex justify-center mt-10 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  /* ========================================================
     RENDER UI
  ======================================================== */
  return (
    <div className="bg-gray-50 min-h-screen flex justify-center py-8 px-4">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-md border p-5">
        <h2 className="text-xl font-semibold mb-4">My Network</h2>

        {/* Connection Requests to me */}
        {requests.length > 0 && (
          <div className="mb-6">
            <h3 className="text-gray-700 font-medium mb-3">
              Connection Requests
            </h3>
            {requests.map((r) => (
              <div key={r.from._id} className="flex justify-between items-center border-b py-3">
                <div className="flex items-center gap-3">
                  <img
                    src={r.from.avatar || "/default-avatar.png"}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-semibold">{r.from.name}</p>
                    <p className="text-xs text-gray-500">{r.from.headline || "LinkedIn Member"}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(r.from._id)}
                    className="bg-[#0A66C2] text-white px-3 py-1 rounded-full text-sm flex gap-1 items-center"
                  >
                    <Check className="w-4 h-4" /> Accept
                  </button>
                  <button
                    onClick={() => handleReject(r.from._id)}
                    className="bg-gray-200 px-3 py-1 rounded-full flex gap-1 items-center text-sm"
                  >
                    <X className="w-4 h-4" /> Ignore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All Users */}
        <div className="mb-6">
          <h3 className="text-gray-700 font-medium mb-3">All Members</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            {allUsers
              .filter((u) => u._id !== user?._id)
              .map((u) => {
                const alreadySent = sentRequests.includes(u._id);
                const alreadyConnected = connections.includes(u._id);

                return (
                  <div key={u._id} className="flex items-center justify-between border rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar || "/default-avatar.png"}
                        alt=""
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-semibold">{u.name}</p>
                        <p className="text-xs text-gray-500">
                          {u.headline || "LinkedIn Member"}
                        </p>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    {alreadyConnected ? (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-1 text-sm">
                        <Check className="w-4 h-4" /> Connected
                      </span>
                    ) : alreadySent ? (
                      <button
                        onClick={() => handleCancelRequest(u._id)}
                        className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full flex items-center gap-1 text-sm hover:bg-gray-300"
                      >
                        <Undo2 className="w-4 h-4" /> Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(u._id)}
                        className="bg-[#0A66C2] text-white px-3 py-1 rounded-full flex items-center gap-1 text-sm hover:bg-[#004182]"
                      >
                        <UserPlus className="w-4 h-4" /> Connect
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Notifications */}
        <div>
          <h3 className="text-gray-700 font-medium mb-3">Recent Activity</h3>
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-sm">No notifications.</p>
          ) : (
            notifications.map((n, i) => (
              <div key={i} className="py-2 border-b text-sm">
                <p>{n.message}</p>
                <p className="text-xs text-gray-400">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
