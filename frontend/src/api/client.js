import axios from "axios";

const AUTH_STORAGE_KEY = "helpdeskpro.auth";

export function getStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredAuth(auth) {
  if (auth) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
});

apiClient.interceptors.request.use((config) => {
  const auth = getStoredAuth();
  if (auth?.access_token) {
    config.headers.Authorization = `Bearer ${auth.access_token}`;
  }
  return config;
});

let onUnauthorized = null;
export function registerUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isLoginRequest = error.config?.url?.includes("/auth/login");
    if (status === 401 && !isLoginRequest) {
      setStoredAuth(null);
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

export function extractErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
  }
  return fallback;
}

export default apiClient;
