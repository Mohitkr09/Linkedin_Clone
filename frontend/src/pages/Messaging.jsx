import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_BACKEND_URL); // ⭐ use env variable

export default function Messaging() {
  const { receiverId } = useParams();
  const navigate = useNavigate();

  const loggedUser = JSON.parse(localStorage.getItem("user"));
  const token = loggedUser?.token;

  const [receiver, setReceiver] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [connections, setConnections] = useState([]);
  const bottomRef = useRef(null);

  if (!loggedUser) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Please log in to view messages.
      </div>
    );
  }

  /* =======================================================
     SOCKET: Register logged-in user
  ======================================================= */
  useEffect(() => {
    socket.emit("registerUser", loggedUser._id);
  }, []);

  /* =======================================================
     SOCKET: Receive real-time messages
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
     FETCH: Receiver profile
  ======================================================= */
  useEffect(() => {
    if (!receiverId) return;
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/users/${receiverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setReceiver(res.data))
      .catch(() => navigate("/messaging"));
  }, [receiverId]);

  /* =======================================================
     FETCH: User Connections (not following)
  ======================================================= */
  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setConnections(res.data.connections || []))
      .catch((err) => console.error(err));
  }, []);

  /* =======================================================
     FETCH: Chat history
  ======================================================= */
  useEffect(() => {
    if (!receiverId) return;

    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/messages/${receiverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMessages(res.data))
      .catch((err) => console.error("❌ Error fetching messages:", err));
  }, [receiverId]);

  /* =======================================================
     SCROLL to bottom on message update
  ======================================================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* =======================================================
     SEND MESSAGE
  ======================================================= */
  const handleSend = () => {
    const text = newMessage.trim();
    if (!text) return;

    socket.emit("sendMessage", {
      senderId: loggedUser._id,
      receiverId,
      content: text,
    });

    setNewMessage("");
  };

  /* =======================================================
     HOME VIEW: When receiver not selected
  ======================================================= */
  if (!receiverId) {
    return (
      <div className="w-full flex justify-center mt-20 gap-10 px-6">
        <div className="w-[40%] bg-white border shadow-sm p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Chats</h2>
          <p className="text-gray-500 text-sm">
            Select a connection to start messaging.
          </p>
        </div>

        <div className="w-[40%] bg-white border shadow-sm p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Connections</h2>
          {connections.length === 0 ? (
            <p className="text-gray-500 text-sm">No connections yet.</p>
          ) : (
            connections.map((contact) => (
              <Link
                key={contact._id}
                to={`/messaging/${contact._id}`}
                className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md"
              >
                <img
                  src={
                    contact.avatar ||
                    "https://cdn-icons-png.flaticon.com/512/1144/1144760.png"
                  }
                  className="w-10 h-10 rounded-full"
                />
                <p className="font-medium text-gray-700">{contact.name}</p>
              </Link>
            ))
          )}
        </div>
      </div>
    );
  }

  /* =======================================================
     CHAT VIEW
  ======================================================= */
  return (
    <div className="max-w-3xl mx-auto mt-16 bg-white border rounded-lg shadow-sm flex flex-col h-[80vh]">
      {/* HEADER */}
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

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map((msg, i) => {
          const mine =
            msg.sender === loggedUser._id ||
            msg.sender?._id === loggedUser._id;

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

      {/* INPUT */}
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
