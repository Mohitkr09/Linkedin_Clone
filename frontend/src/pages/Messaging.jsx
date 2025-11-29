// src/pages/Messaging.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

// Correct socket URL
const socket = io(import.meta.env.VITE_SOCKET_URL, { transports: ["websocket"] });

export default function Messaging() {
  const { receiverId } = useParams();
  const navigate = useNavigate();

  const loggedUser = JSON.parse(localStorage.getItem("user"));
  const token = loggedUser?.token;
  const API_URL = import.meta.env.VITE_API_URL; // must end with /api

  const [receiver, setReceiver] = useState(null);
  const [connections, setConnections] = useState([]); // FULL user objects
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const bottomRef = useRef(null);

  if (!loggedUser)
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Please log in to view messages.
      </div>
    );

  /* 1️⃣ REGISTER USER WITH SOCKET */
  useEffect(() => {
    socket.emit("registerUser", loggedUser._id);
  }, []);

  /* 2️⃣ SOCKET LISTEN FOR NEW MESSAGES */
  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      if (msg.sender._id === receiverId || msg.receiver._id === receiverId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => socket.off("receiveMessage");
  }, [receiverId]);

  /* 🔍 FETCH RECEIVER PROFILE */
  useEffect(() => {
    if (!receiverId) return;

    axios
      .get(`${API_URL}/users/${receiverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setReceiver(res.data))
      .catch(() => navigate("/messaging"));
  }, [receiverId]);

  /* 👥 FETCH CONNECTIONS AS FULL USER OBJECTS */
  useEffect(() => {
    axios
      .get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(async (res) => {
        const ids = res.data.connections || [];

        // fetch user details for each connection id
        const profiles = await Promise.all(
          ids.map((id) =>
            axios.get(`${API_URL}/users/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          )
        );

        setConnections(profiles.map((p) => p.data));
      })
      .catch((err) => console.error("Connection load error:", err));
  }, []);

  /* 🛑 BLOCK CHAT IF NOT CONNECTED */
  useEffect(() => {
    if (receiverId && !connections.some((u) => u._id === receiverId)) {
      navigate("/messaging");
    }
  }, [connections, receiverId]);

  /* 💬 LOAD CHAT HISTORY */
  useEffect(() => {
    if (!receiverId) return;

    axios
      .get(`${API_URL}/messages/${receiverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMessages(res.data))
      .catch(() => setMessages([]));
  }, [receiverId]);

  /* 📜 SCROLL TO LAST MESSAGE */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* 🚀 SEND MESSAGE */
  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text) return;

    try {
      const res = await axios.post(
        `${API_URL}/messages`,
        { to: receiverId, text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      socket.emit("sendMessage", {
        senderId: loggedUser._id,
        receiverId,
        content: text,
      });

      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
    } catch (err) {
      console.log("Send failed:", err);
    }
  };

  /* 🏠 NO USER SELECTED VIEW */
  if (!receiverId) {
    return (
      <div className="flex justify-center mt-20 gap-10 px-6">

        {/* LEFT SECTION */}
        <div className="w-[40%] bg-white border p-4 shadow rounded-lg">
          <h2 className="text-lg font-semibold">Chats</h2>
          <p className="text-gray-500">Select a connection to start chatting.</p>
        </div>

        {/* CONNECTION LIST */}
        <div className="w-[40%] bg-white border p-4 shadow rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Connections</h2>

          {connections.length === 0 ? (
            <p className="text-gray-500">No connections available.</p>
          ) : (
            connections.map((user) => (
              <Link
                key={user._id}
                to={`/messaging/${user._id}`}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100"
              >
                <img
                  src={user.avatar || "https://cdn-icons-png.flaticon.com/512/1144/1144760.png"}
                  className="w-10 h-10 rounded-full"
                />
                <p className="font-medium text-gray-800">{user.name}</p>
              </Link>
            ))
          )}
        </div>
      </div>
    );
  }

  /* 💬 CHAT WINDOW */
  return (
    <div className="max-w-3xl mx-auto bg-white border rounded-lg shadow-sm mt-16 flex flex-col h-[80vh]">

      {/* HEADER */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <img
          src={receiver?.avatar || "https://cdn-icons-png.flaticon.com/512/1144/1144760.png"}
          className="w-10 h-10 rounded-full"
        />
        <h2 className="font-semibold text-gray-700">{receiver?.name}</h2>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map((msg, i) => {
          const mine = msg.sender._id === loggedUser._id;
          return (
            <div key={i} className={`flex mb-2 ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`px-3 py-2 rounded-lg max-w-[70%] ${
                  mine ? "bg-[#0A66C2] text-white" : "bg-gray-200 text-gray-800"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* INPUT BOX */}
      <div className="p-3 border-t flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 border rounded-full px-4 py-2 outline-none focus:ring-[#0A66C2]"
          placeholder="Write a message..."
        />
        <button
          onClick={handleSend}
          className="bg-[#0A66C2] text-white px-4 py-2 rounded-full hover:bg-[#004182]"
        >
          Send
        </button>
      </div>
    </div>
  );
}
