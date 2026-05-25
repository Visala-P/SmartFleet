import axios from "axios";

const AUTH_TOKEN_STORAGE_KEY = "smartfleet_auth_token";

const resolveBaseUrl = () => {
  const configured = (import.meta.env.VITE_API_BASE_URL as string | undefined) || (import.meta.env.VITE_API_URL as string | undefined);

  if (configured?.trim()) {
    return configured.trim().replace(/\/+$/, "");
  }

  if (import.meta.env.DEV) {
    return "http://localhost:5000/api";
  }

  return "/api";
};

const base = resolveBaseUrl();

const api = axios.create({
  baseURL: base,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
