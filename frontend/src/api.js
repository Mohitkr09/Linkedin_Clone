import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000/api";

const API = axios.create({ baseURL });

API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

export default API;
