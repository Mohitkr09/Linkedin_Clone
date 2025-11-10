import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Register user
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        name,
        email,
        password,
      });

      // ✅ Immediately login user after registration
      const loginRes = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      // ✅ Save user & token to localStorage
      localStorage.setItem("user", JSON.stringify(loginRes.data));

      // ✅ Redirect new user to My Network (to connect with others)
      alert("🎉 Account created successfully! Welcome to LinkedIn.");
      navigate("/network");
    } catch (err) {
      console.error("❌ Registration error:", err.response?.data || err);
      alert(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#f3f2ef]">
      {/* LinkedIn Logo */}
      <div className="flex items-center mb-8">
        <img src="/linkedin.png" alt="LinkedIn" className="w-10 h-10 mr-2" />
        <h1 className="text-3xl font-semibold text-[#0A66C2]">LinkedIn</h1>
      </div>

      {/* Signup Card */}
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-8 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Make the most of your professional life
        </h2>

        <form onSubmit={handleSignup} className="mt-4">
          <input
            type="text"
            placeholder="Full name"
            className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-1 focus:ring-[#0A66C2]"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
            placeholder="Password (6 or more characters)"
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
            {loading ? "Creating your account..." : "Agree & Join"}
          </button>
        </form>

        <p className="text-sm text-gray-600 text-center mt-4">
          Already on LinkedIn?{" "}
          <span
            className="text-[#0A66C2] cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}
