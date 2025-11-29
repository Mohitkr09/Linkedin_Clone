// src/pages/ChatWindow.jsx
import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import API from "../api";
import { useParams, useNavigate } from "react-router-dom";

export default function ChatWindow() {
  const { userId } = useParams(); // Receiver ID
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [connections, setConnections] = useState([]);
  const [text, setText] = useState("");

  const socket = useRef(null);
  const bottomRef = useRef(null);

  const loggedUser = JSON.parse(localStorage.getItem("user"));
  const token = loggedUser?.token;

  /* =========================================================
     AUTH CHECK
  ========================================================= */
  if (!loggedUser) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Please login to access chat.
      </div>
    );
  }

  /* =========================================================
     SOCKET INIT + REGISTER USER
  ========================================================= */
  useEffect(() => {
    if (!socket.current) {
      socket.current = io(import.meta.env.VITE_SOCKET_URL, {
        withCredentials: true,
        transports: ["websocket"],
      });

      socket.current.emit("registerUser", loggedUser._id);
    }

    socket.current.on("receiveMessage", (msg) => {
      if (msg.sender._id === userId || msg.receiver._id === userId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => socket.current.off("receiveMessage");
  }, [userId]);

  /* =========================================================
     FETCH CONNECTED USERS
  ========================================================= */
  useEffect(() => {
    API.get("/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => setConnections(res.data.connections || []))
      .catch((err) => console.error("❌ Error fetching connections:", err));
  }, []);

  /* =========================================================
     BLOCK CHAT IF USER NOT IN CONNECTIONS
  ========================================================= */
  useEffect(() => {
    if (connections.length > 0 && !connections.includes(userId)) {
      navigate("/messaging");
    }
  }, [connections, userId]);

  /* =========================================================
     FETCH CHAT HISTORY
  ========================================================= */
  useEffect(() => {
    if (!userId) return;

    API.get(`/messages/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => setMessages(res.data || []))
      .catch((err) => console.error("❌ History fetch error:", err));
  }, [userId]);

  /* =========================================================
     AUTO SCROLL
  ========================================================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* =========================================================
     SEND MESSAGE
  ========================================================= */
  const sendMessage = async () => {
    const content = text.trim();
    if (!content) return;

    try {
      await API.post(
        "/messages",
        { to: userId, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      socket.current.emit("sendMessage", {
        senderId: loggedUser._id,
        receiverId: userId,
        content,
      });

      setMessages((prev) => [
        ...prev,
        { sender: { _id: loggedUser._id }, content },
      ]);

      setText("");
    } catch (error) {
      console.error("❌ Send error:", error);
      alert("Failed to send message.");
    }
  };

  /* =========================================================
     UI
  ========================================================= */
  return (
    <div className="pt-20 max-w-4xl mx-auto bg-white rounded-xl shadow-md p-4 border">
      {/* CHAT HISTORY */}
      <div className="h-[60vh] overflow-y-auto border-b pb-4">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 mt-20">
            No messages yet. Say hello 👋
          </p>
        ) : (
          messages.map((msg, i) => {
            const mine = msg.sender?._id === loggedUser._id;
            return (
              <div
                key={i}
                className={`my-2 flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2 rounded-lg text-sm max-w-[70%] ${
                    mine
                      ? "bg-[#0A66C2] text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* INPUT BOX */}
      <div className="flex mt-4 gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded-full px-4 py-2 text-sm outline-none focus:ring-[#0A66C2]"
        />
        <button
          onClick={sendMessage}
          className="bg-[#0A66C2] text-white px-4 py-2 rounded-full hover:bg-[#004182]"
        >
          Send
        </button>
      </div>
    </div>
  );
}
