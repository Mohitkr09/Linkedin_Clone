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

  const handleAccept = async (id) => {
    try {
      await API.put(`/connections/accept/${id}`);
      toast.success("Connection accepted!");
      setRequests((prev) => prev.filter((r) => r.from._id !== id));
      setConnections((prev) => [...prev, id]);
    } catch {
      toast.error("Failed to accept connection.");
    }
  };

  const handleReject = async (id) => {
    try {
      await API.put(`/connections/reject/${id}`);
      toast("Request ignored.", { icon: "🚫" });
      setRequests((prev) => prev.filter((r) => r.from._id !== id));
    } catch {
      toast.error("Failed to reject request.");
    }
  };

  const handleConnect = async (id) => {
    try {
      await API.post(`/connections/request/${id}`);
      toast.success("Connection request sent!");
      setSentRequests((prev) => [...prev, id]);
    } catch {
      toast.error("Failed to send request.");
    }
  };

  const handleCancelRequest = async (id) => {
    try {
      await API.delete(`/connections/request/cancel/${id}`);
      toast.success("Request cancelled");
      setSentRequests((prev) => prev.filter((u) => u !== id));
    } catch {
      toast.error("Failed to cancel request.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center mt-10 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex justify-center px-4 py-6">
      <div className="w-full max-w-7xl flex gap-6">

        {/* ================= LEFT SIDEBAR ================= */}
        <div className="hidden lg:block w-72 space-y-4">
          <div className="bg-white border shadow rounded-xl p-4">
            <h2 className="font-semibold text-gray-800 mb-3">
              Manage my network
            </h2>

            <div className="space-y-3 text-sm">
              <p className="flex justify-between">
                <span className="flex gap-2">
                  👥 Connections
                </span>
                {connections.length}
              </p>
              <p className="flex justify-between">
                <span>Following & followers</span> —
              </p>
              <p className="flex justify-between">
                <span>Groups</span> 1
              </p>
              <p className="flex justify-between">
                <span>Events</span> 0
              </p>
              <p className="flex justify-between">
                <span>Pages</span> 21
              </p>
              <p className="flex justify-between">
                <span>Newsletters</span> 4
              </p>
            </div>
          </div>
        </div>

        {/* ================= CENTER SECTION ================= */}
        <div className="flex-1 space-y-6">

          {/* TOP TAB SECTION */}
          <div className="bg-white border shadow rounded-xl p-4">
            <div className="flex gap-6 border-b pb-2">
              <button className="text-[#0A66C2] font-semibold border-b-2 border-[#0A66C2]">
                Grow
              </button>
              <button className="text-gray-600 hover:text-black">Catch up</button>
            </div>
          </div>

          {/* INVITATIONS */}
          {requests.length > 0 && (
            <div className="bg-white border shadow rounded-xl p-4">
              <div className="flex justify-between mb-3">
                <h3 className="font-medium">Invitations ({requests.length})</h3>
                <span className="text-[#0A66C2] text-sm cursor-pointer hover:underline">
                  Show all
                </span>
              </div>

              {requests.map((r) => (
                <div key={r.from._id} className="flex justify-between items-center border-b py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={r.from.avatar || "/default-avatar.png"}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-semibold">{r.from.name}</p>
                      <p className="text-xs text-gray-600">
                        {r.from.headline || "LinkedIn Member"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(r.from._id)}
                      className="px-4 py-1 rounded-full bg-gray-200 text-sm"
                    >
                      Ignore
                    </button>
                    <button
                      onClick={() => handleAccept(r.from._id)}
                      className="px-4 py-1 rounded-full bg-[#0A66C2] text-white text-sm"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PUZZLE CARD */}
          <div className="bg-white border shadow rounded-xl p-4">
            <h3 className="font-semibold">Take a break with a LinkedIn puzzle game</h3>
            <p className="text-sm text-gray-600">Solve in 60s or less!</p>
            <button className="mt-3 w-full border rounded-full py-1 text-sm text-[#0A66C2] hover:bg-gray-100">
              Solve now
            </button>
          </div>

          {/* PEOPLE YOU MAY KNOW */}
          <div className="bg-white border shadow rounded-xl p-4">
            <div className="flex justify-between mb-3">
              <h3 className="font-medium">People you may know</h3>
              <span className="text-[#0A66C2] text-sm cursor-pointer hover:underline">
                Show all
              </span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2">

              {allUsers
                .filter((u) => u._id !== user._id)
                .slice(0, 10)
                .map((u) => {
                  const sent = sentRequests.includes(u._id);
                  const connected = connections.includes(u._id);

                  return (
                    <div
                      key={u._id}
                      className="border rounded-xl p-3 w-52 flex-shrink-0 bg-white"
                    >
                      <img
                        src={u.avatar || "/default-avatar.png"}
                        className="w-20 h-20 rounded-full mx-auto"
                      />
                      <p className="mt-2 text-center font-semibold text-sm">
                        {u.name}
                      </p>
                      <p className="text-xs text-gray-600 text-center">
                        {u.headline || "LinkedIn Member"}
                      </p>

                      {connected ? (
                        <button className="mt-2 w-full bg-green-100 text-green-700 rounded-full py-1 text-xs">
                          Connected
                        </button>
                      ) : sent ? (
                        <button
                          onClick={() => handleCancelRequest(u._id)}
                          className="mt-2 w-full bg-gray-200 rounded-full py-1 text-xs"
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(u._id)}
                          className="mt-2 w-full bg-[#0A66C2] text-white rounded-full py-1 text-xs"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

        </div>

        {/* ================= RIGHT SIDEBAR AD ================= */}
        <div className="hidden xl:block w-72 space-y-4">

          <div className="bg-white border shadow rounded-xl p-4">
            <p className="font-semibold">Mohit, grow your career by following Aramco</p>
            <p className="text-sm text-gray-600">Visit the company page for Aramco!</p>
            <button className="mt-3 w-full bg-[#0A66C2] text-white rounded-full py-1.5">
              Follow
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
