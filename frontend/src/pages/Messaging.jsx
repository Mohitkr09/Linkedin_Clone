import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // ✅ Connect to backend

export default function Messaging() {
  const { receiverId } = useParams();
  const loggedUser = JSON.parse(localStorage.getItem("user"));

  const [receiver, setReceiver] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // 🚫 Redirect if not logged in
  if (!loggedUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-600 text-lg">Please log in to view messages.</p>
      </div>
    );
  }

  /* =======================================================
     ✅ Connect to Socket.IO
  ======================================================= */
  useEffect(() => {
    socket.emit("registerUser", loggedUser._id);
  }, [loggedUser]);

  /* =======================================================
     ✅ Listen for incoming messages in real time
  ======================================================= */
  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      if (
        msg.sender._id === receiverId ||
        msg.receiver._id === receiverId
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => socket.off("receiveMessage");
  }, [receiverId]);

  /* =======================================================
     ✅ Fetch receiver details
  ======================================================= */
  useEffect(() => {
    if (!receiverId) return;
    const fetchReceiver = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:5000/api/users/${receiverId}`,
          {
            headers: { Authorization: `Bearer ${loggedUser.token}` },
          }
        );
        setReceiver(res.data);
      } catch (err) {
        console.error("❌ Error fetching receiver:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReceiver();
  }, [receiverId]);

  /* =======================================================
     ✅ Fetch following list
  ======================================================= */
  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/users/${loggedUser._id}`,
          {
            headers: { Authorization: `Bearer ${loggedUser.token}` },
          }
        );
        setFollowing(res.data.following || []);
      } catch (err) {
        console.error("❌ Error fetching following list:", err);
      }
    };
    fetchFollowing();
  }, []);

  /* =======================================================
     ✅ Fetch chat history
  ======================================================= */
  useEffect(() => {
    if (!receiverId) return;
    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/messages/${receiverId}`,
          {
            headers: { Authorization: `Bearer ${loggedUser.token}` },
          }
        );
        setMessages(res.data || []);
      } catch (err) {
        console.error("❌ Error fetching messages:", err);
      }
    };
    fetchMessages();
  }, [receiverId]);

  /* =======================================================
     ✅ Auto-scroll
  ======================================================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* =======================================================
     ✅ Send message via socket
  ======================================================= */
  const handleSend = async () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return alert("Type a message!");

    const newMsg = {
      senderId: loggedUser._id,
      receiverId,
      content: trimmed,
    };

    socket.emit("sendMessage", newMsg); // ✅ send to server
    setNewMessage("");
  };

  /* =======================================================
     🧭 Inbox (no receiver selected)
  ======================================================= */
  if (!receiverId) {
    return (
      <div className="flex justify-center items-start mt-16 gap-8 px-8">
        <div className="w-1/2 bg-white border rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-4">Messages</h2>
          <p className="text-gray-500 text-sm">
            Select a user from the right to start chatting.
          </p>
        </div>

        <div className="w-1/2 bg-white border rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-4">Following</h2>
          <div className="space-y-3">
            {following.length === 0 && (
              <p className="text-gray-500 text-sm">
                You are not following anyone yet.
              </p>
            )}
            {following.map((user) => (
              <Link
                key={user._id}
                to={`/messaging/${user._id}`}
                className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded-md"
              >
                <img
                  src={
                    user.avatar ||
                    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                  }
                  alt={user.name || "User"}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <p className="text-gray-800 font-medium">{user.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     💬 Chat View
  ======================================================= */
  return (
    <div className="flex flex-col h-[80vh] bg-gray-50 max-w-3xl mx-auto mt-16 rounded-lg border shadow-sm">
      <div className="flex items-center gap-3 p-4 border-b bg-white">
        {loading ? (
          <p className="text-gray-500 text-sm">Loading chat...</p>
        ) : (
          <>
            <img
              src={
                receiver?.avatar ||
                "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
              }
              alt={receiver?.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <h2 className="font-semibold text-gray-800">
              {receiver?.name || "User"}
            </h2>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center mt-10">
            No messages yet. Say hello 👋
          </p>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`my-2 flex ${
                msg.sender === loggedUser._id ||
                msg.sender?._id === loggedUser._id
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`px-3 py-2 rounded-lg max-w-[70%] ${
                  msg.sender === loggedUser._id ||
                  msg.sender?._id === loggedUser._id
                    ? "bg-[#0A66C2] text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-white flex items-center gap-3">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-[#0A66C2] outline-none"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 rounded-full bg-[#0A66C2] text-white hover:bg-[#004182]"
        >
          Send
        </button>
      </div>
    </div>
  );
}
