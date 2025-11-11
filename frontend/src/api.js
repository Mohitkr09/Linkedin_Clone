import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://pacific-dedication-production-dbe8.up.railway.app/api",
});

// ✅ attach token automatically
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
