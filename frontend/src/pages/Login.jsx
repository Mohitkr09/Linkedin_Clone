import React, { useState } from "react";
import API from "../api"; // ✅ use your shared API instance
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { email, password });
      localStorage.setItem("user", JSON.stringify(res.data));
      navigate("/feed");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#f3f2ef]">
      {/* Logo */}
      <div className="flex items-center mb-8">
        <img src="/linkedin.png" alt="LinkedIn" className="w-10 h-10 mr-2" />
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
            className={`w-full py-2 rounded-full text-white font-medium transition ${
              loading
                ? "bg-[#0A66C2]/60 cursor-not-allowed"
                : "bg-[#0A66C2] hover:bg-[#004182]"
            }`}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="flex items-center my-6">
          <hr className="flex-grow border-gray-300" />
          <span className="text-gray-400 text-xs mx-2">or</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        {/* ✅ Updated: Navigate to /register */}
        <button
          onClick={() => navigate("/register")}
          className="w-full border border-gray-400 py-2 rounded-full text-gray-700 font-medium hover:bg-gray-100 transition"
        >
          New to LinkedIn? Join now
        </button>
      </div>
    </div>
  );
}
