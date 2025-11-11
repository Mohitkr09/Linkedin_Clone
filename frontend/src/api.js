// src/api/axios.js
import axios from "axios";

const instance = axios.create({
  // ✅ Ensure no extra /api in .env — handled in code instead
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: false, // Usually false for token-based auth (set true if using cookies)
});

// ✅ Add interceptor to attach JWT automatically
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ Ensure proper content type for POST/PUT
    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Optional: handle token expiry (401 global handler)
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("🔒 Token expired or unauthorized. Redirecting to login...");
      localStorage.removeItem("token");
      window.location.href = "/login"; // redirect user automatically
    }
    return Promise.reject(error);
  }
);

export default instance;
