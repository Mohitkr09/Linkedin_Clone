import React, { useEffect, useState } from "react";
import API from "../api";
import { Loader2, Check, X, UserPlus } from "lucide-react";
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
     ✅ Fetch All Network Data
  ======================================================== */
  const fetchData = async () => {
    try {
      const [reqRes, notifRes, usersRes, sentRes, meRes] = await Promise.all([
        API.get("/connections/requests"),
        API.get("/connections/notifications"),
        API.get("/users/all"),
        API.get("/connections/sent"),
        API.get("/users/me"), // get my profile to know my connections
      ]);

      const reqData = Array.isArray(reqRes.data)
        ? reqRes.data
        : reqRes.data.requests || [];

      const notifData = Array.isArray(notifRes.data)
        ? notifRes.data
        : notifRes.data.notifications || [];

      const usersData = Array.isArray(usersRes.data)
        ? usersRes.data
        : usersRes.data.users || [];

      const sentData = Array.isArray(sentRes.data)
        ? sentRes.data
        : sentRes.data.sent || [];

      const meData = meRes.data || {};
      const connectionIds = (meData.connections || []).map((c) =>
        typeof c === "string" ? c : c._id
      );

      setRequests(reqData);
      setNotifications(notifData);
      setAllUsers(usersData);
      setSentRequests(sentData.map((u) => u._id));
      setConnections(connectionIds);
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
     ✅ Connection Request Actions
  ======================================================== */
  const handleAccept = async (id) => {
    try {
      await API.put(`/connections/accept/${id}`);
      toast.success("Connection accepted!");
      setRequests((prev) => prev.filter((r) => r.from._id !== id));
      setConnections((prev) => [...prev, id]);
    } catch (err) {
      console.error("❌ Accept request failed:", err);
      toast.error("Failed to accept connection.");
    }
  };

  const handleReject = async (id) => {
    try {
      await API.put(`/connections/reject/${id}`);
      toast("Request ignored.", { icon: "🚫" });
      setRequests((prev) => prev.filter((r) => r.from._id !== id));
    } catch (err) {
      console.error("❌ Reject request failed:", err);
      toast.error("Failed to reject request.");
    }
  };

  const handleConnect = async (id) => {
    try {
      await API.post(`/connections/request/${id}`);
      setSentRequests((prev) => [...prev, id]);
      toast.success("Connection request sent!");
    } catch (err) {
      console.error("❌ Connection request failed:", err);
      toast.error("Failed to send request.");
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
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-md border p-5">
        <h2 className="text-xl font-semibold mb-4">My Network</h2>

        {/* Connection Requests */}
        {requests.length > 0 && (
          <div className="mb-6">
            <h3 className="text-gray-700 font-medium mb-3">
              Connection Requests
            </h3>
            {requests.map((r) => (
              <div
                key={r.from?._id}
                className="flex items-center justify-between border-b py-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={r.from?.avatar || "/default-avatar.png"}
                    alt="avatar"
                    onError={(e) => (e.target.src = "/default-avatar.png")}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-semibold">{r.from?.name}</p>
                    <p className="text-xs text-gray-500">
                      {r.from?.headline || "LinkedIn Member"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
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

        {/* All Registered Users */}
        <div className="mb-6">
          <h3 className="text-gray-700 font-medium mb-3">All LinkedIn Members</h3>
          {allUsers.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No users found to connect with.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {allUsers
                .filter((u) => u._id !== user?._id)
                .map((u) => {
                  const alreadySent = sentRequests.includes(u._id);
                  const alreadyConnected = connections.includes(u._id);

                  return (
                    <div
                      key={u._id}
                      className="flex items-center justify-between border rounded-lg p-3 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || "/default-avatar.png"}
                          alt={u.name}
                          onError={(e) =>
                            (e.target.src = "/default-avatar.png")
                          }
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500">
                            {u.headline || "LinkedIn Member"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleConnect(u._id)}
                        disabled={alreadySent || alreadyConnected}
                        className={`px-3 py-1.5 rounded-full flex items-center gap-1 text-sm transition ${
                          alreadyConnected
                            ? "bg-green-100 text-green-600 cursor-default"
                            : alreadySent
                            ? "bg-gray-200 text-gray-600 cursor-default"
                            : "bg-[#0A66C2] text-white hover:bg-[#004182]"
                        }`}
                      >
                        {alreadyConnected ? (
                          <>
                            <Check className="w-4 h-4" /> Connected
                          </>
                        ) : alreadySent ? (
                          "Requested"
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" /> Connect
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div>
          <h3 className="text-gray-700 font-medium mb-3">Recent Activity</h3>
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-sm">No new notifications.</p>
          ) : (
            notifications.map((n, i) => (
              <div
                key={n._id || i}
                className="border-b py-2 text-sm text-gray-700"
              >
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
