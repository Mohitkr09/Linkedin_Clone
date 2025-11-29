import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import API from "../api";
import { useParams, useNavigate } from "react-router-dom";

export default function ChatWindow() {
  const { userId } = useParams(); // Chat partner ID
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
     SOCKET INIT and LISTEN
  ========================================================= */
  useEffect(() => {
    if (!socket.current) {
      socket.current = io(import.meta.env.VITE_BACKEND_URL);
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
     FETCH CONNECTIONS (ONLY ACCEPTED USERS)
  ========================================================= */
  useEffect(() => {
    API.get("/users/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setConnections(res.data.connections || []))
      .catch((err) => console.error("❌ Error fetching connections:", err));
  }, []);

  /* =========================================================
     BLOCK CHAT IF NOT A CONNECTION
  ========================================================= */
  useEffect(() => {
    if (connections.length > 0 && !connections.includes(userId)) {
      navigate("/messaging"); // redirect away
    }
  }, [connections, userId]);

  /* =========================================================
     FETCH CHAT HISTORY
  ========================================================= */
  useEffect(() => {
    if (!userId) return;
    API.get(`/messages/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setMessages(res.data || []))
      .catch((err) => console.error("❌ Error fetching messages:", err));
  }, [userId]);

  /* =========================================================
     AUTO-SCROLL TO BOTTOM ON NEW MESSAGE
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

    // Store in DB
    await API.post(
      "/messages",
      { to: userId, text: content },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Emit via socket
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
  };

  /* =========================================================
     UI RENDER
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
              <div key={i} className={`my-2 flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`px-4 py-2 rounded-lg text-sm max-w-[70%] ${
                    mine ? "bg-[#0A66C2] text-white" : "bg-gray-200 text-gray-800"
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
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border rounded-full px-4 py-2 text-sm outline-none focus:ring-[#0A66C2]"
          placeholder="Type a message..."
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
