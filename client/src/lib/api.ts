import axios from "axios";

// Prefer `VITE_API_URL` when provided. For local development only, if no
// env var is set, fall back to the local backend address so login works
// on `localhost` without extra configuration. In production the env var
// should be set and will take precedence.
const envBase = (import.meta.env.VITE_API_URL as string | undefined) || undefined;
let base = "";

if (envBase) {
  base = envBase;
} else if (typeof window !== "undefined") {
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";
  base = isLocal ? "http://localhost:5000/api" : ""; // local dev fallback only
}

const api = axios.create({
  baseURL: base,
  withCredentials: true,
});

export default api;
