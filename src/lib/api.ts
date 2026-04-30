import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api/v1";

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  if (config.data && typeof config.data === "object" && !(config.data instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  }
  const token = localStorage.getItem("fc_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("fc_token");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);
