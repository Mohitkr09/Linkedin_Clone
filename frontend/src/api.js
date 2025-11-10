import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // ✅ should point to your backend on Railway
});

// ✅ Automatically attach JWT token to every request
API.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    } else {
      console.warn("⚠️ No token found in localStorage");
    }
  } catch (err) {
    console.warn("⚠️ Error parsing user token:", err);
  }
  return config;
});

export default API;
