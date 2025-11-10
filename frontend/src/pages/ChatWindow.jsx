import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import API from "../api";
import { useParams } from "react-router-dom";

export default function ChatWindow() {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const socket = useRef(null);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    socket.current = io("http://localhost:5000");
    socket.current.emit("registerUser", user._id);

    socket.current.on("receiveMessage", (data) => {
      if (data.senderId === userId) {
        setMessages((prev) => [...prev, { sender: { _id: userId }, content: data.content }]);
      }
    });

    fetchConversation();

    return () => socket.current.disconnect();
  }, [userId]);

  const fetchConversation = async () => {
    const res = await API.get(`/messages/${userId}`);
    setMessages(res.data);
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    await API.post("/messages", { receiverId: userId, content: text });
    socket.current.emit("sendMessage", {
      senderId: user._id,
      receiverId: userId,
      content: text,
    });
    setMessages((prev) => [...prev, { sender: { _id: user._id }, content: text }]);
    setText("");
  };

  return (
    <div className="pt-20 max-w-4xl mx-auto bg-white rounded-xl shadow-md p-4 border">
      <div className="h-[60vh] overflow-y-auto border-b pb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`my-2 flex ${
              msg.sender._id === user._id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-4 py-2 rounded-lg ${
                msg.sender._id === user._id
                  ? "bg-[#0A66C2] text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <div className="flex mt-4 gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border rounded-full px-4 py-2 text-sm"
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
