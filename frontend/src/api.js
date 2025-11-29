// src/api/axios.js
import axios from "axios";

const BASE_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

const instance = axios.create({
  baseURL: `${BASE_URL}/api`, // ALWAYS ends with /api
  withCredentials: false,
});

// 🔐 Attach token
instance.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = user?.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 🚨 Auto logout on 401
instance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default instance;
