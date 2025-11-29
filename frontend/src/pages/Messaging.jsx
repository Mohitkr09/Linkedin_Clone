import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_BACKEND_URL);

export default function Messaging() {
  const { receiverId } = useParams();
  const navigate = useNavigate();
  const loggedUser = JSON.parse(localStorage.getItem("user"));
  const token = loggedUser?.token;

  const [receiver, setReceiver] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // 👇 WILL STORE FULL CONNECTED USER OBJECTS
  const [connections, setConnections] = useState([]);

  const bottomRef = useRef(null);

  if (!loggedUser) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Please log in to view messages.
      </div>
    );
  }

  /* SOCKET REGISTER */
  useEffect(() => {
    socket.emit("registerUser", loggedUser._id);
  }, []);

  /* SOCKET RECEIVE */
  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      if (msg.sender._id === receiverId || msg.receiver._id === receiverId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => socket.off("receiveMessage");
  }, [receiverId]);

  /* FETCH RECEIVER DATA */
  useEffect(() => {
    if (!receiverId) return;

    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/users/${receiverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setReceiver(res.data))
      .catch(() => navigate("/messaging"));
  }, [receiverId]);

  /* 🚀 FETCH FULL CONNECTION PROFILES */
  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(async (res) => {
        const ids = res.data.connections || [];

        // now fetch full profile of each
        const responses = await Promise.all(
          ids.map((id) =>
            axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          )
        );

        const users = responses.map((r) => r.data);
        setConnections(users);
      })
      .catch((err) => console.error(err));
  }, []);

  /* BLOCK CHAT IF RECEIVER NOT CONNECTED */
  useEffect(() => {
    if (receiverId && !connections.some((u) => u._id === receiverId)) {
      navigate("/messaging");
    }
  }, [connections, receiverId]);

  /* FETCH CHAT HISTORY */
  useEffect(() => {
    if (!receiverId) return;

    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/messages/${receiverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMessages(res.data))
      .catch(() => setMessages([]));
  }, [receiverId]);

  /* AUTO SCROLL */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* SEND MESSAGE */
  const handleSend = () => {
    const text = newMessage.trim();
    if (!text) return;
    if (!connections.some((u) => u._id === receiverId)) return;

    socket.emit("sendMessage", {
      senderId: loggedUser._id,
      receiverId,
      content: text,
    });

    setNewMessage("");
  };

  /* HOME VIEW */
  if (!receiverId) {
    return (
      <div className="w-full flex justify-center mt-20 gap-10 px-6">
        <div className="w-[40%] bg-white border p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Chats</h2>
          <p className="text-gray-500 text-sm">Select a connection to start messaging.</p>
        </div>

        <div className="w-[40%] bg-white border p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Connections</h2>

          {connections.length === 0 ? (
            <p className="text-gray-500 text-sm">No connections available.</p>
          ) : (
            connections.map((user) => (
              <Link
                key={user._id}
                to={`/messaging/${user._id}`}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100"
              >
                <img
                  src={
                    user.avatar ||
                    "https://cdn-icons-png.flaticon.com/512/1144/1144760.png"
                  }
                  className="w-10 h-10 rounded-full"
                />
                <p className="font-medium text-gray-700">{user.name}</p>
              </Link>
            ))
          )}
        </div>
      </div>
    );
  }

  /* CHAT VIEW */
  return (
    <div className="max-w-3xl mx-auto mt-16 bg-white border rounded-lg shadow-sm flex flex-col h-[80vh]">
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <img
          src={
            receiver?.avatar ||
            "https://cdn-icons-png.flaticon.com/512/1144/1144760.png"
          }
          className="w-10 h-10 rounded-full"
        />
        <h2 className="font-semibold text-gray-700">{receiver?.name}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex mb-2 ${
              msg.sender._id === loggedUser._id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-3 py-2 rounded-lg max-w-[70%] ${
                msg.sender._id === loggedUser._id
                  ? "bg-[#0A66C2] text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 border rounded-full px-4 py-2 outline-none focus:ring-[#0A66C2]"
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
