import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api"; // ✅ use centralized axios instance (auto sets baseURL)
import { Loader2 } from "lucide-react"; // optional loader icon for better UX

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      // ✅ Use your API helper — automatically handles baseURL & headers
      const res = await API.post("/auth/login", { email, password });

      if (res.data) {
        localStorage.setItem("user", JSON.stringify(res.data));
        navigate("/feed");
      } else {
        alert("Invalid server response. Please try again.");
      }
    } catch (err) {
      console.error("❌ Login failed:", err.response?.data || err);
      alert(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#f3f2ef] px-4">
      {/* LinkedIn Logo */}
      <div className="flex items-center mb-8">
        <img
          src="/linkedin.png"
          alt="LinkedIn"
          className="w-10 h-10 mr-2"
          onError={(e) => (e.target.style.display = "none")} // hide broken image
        />
        <h1 className="text-3xl font-semibold text-[#0A66C2]">LinkedIn</h1>
      </div>

      {/* Login Card */}
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-8 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Sign in</h2>
        <p className="text-gray-600 text-sm mb-6">
          Stay updated on your professional world
        </p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-1 focus:ring-[#0A66C2]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full border border-gray-300 rounded-md px-3 py-2 mb-6 focus:outline-none focus:ring-1 focus:ring-[#0A66C2]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-full text-white font-medium flex items-center justify-center gap-2 transition ${
              loading
                ? "bg-[#0A66C2]/60 cursor-not-allowed"
                : "bg-[#0A66C2] hover:bg-[#004182]"
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="flex items-center my-6">
          <hr className="flex-grow border-gray-300" />
          <span className="text-gray-400 text-xs mx-2">or</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        <button
          onClick={() => navigate("/signup")}
          className="w-full border border-gray-400 py-2 rounded-full text-gray-700 font-medium hover:bg-gray-100 transition"
        >
          New to LinkedIn? Join now
        </button>
      </div>
    </div>
  );
}
