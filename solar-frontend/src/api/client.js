import axios from 'axios';

// Single place for the backend URL. Set VITE_API_BASE_URL in .env (see .env.example).
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');

const TOKEN_KEY = 'solar_token';
const USER_KEY = 'solar_user';

export const tokenStore = {
  get: () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  getUser: () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
  },
  set: (token, user) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch { /* storage unavailable: session lasts until reload */ }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch { /* ignore */ }
  },
};

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Backend answers 401 "Token required" / "Invalid token" (expired or bad JWT).
// Login calls pass skipAuthRedirect so a wrong password is not treated as an expired session.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response && error.response.status;
    if (status === 401 && !(error.config && error.config.skipAuthRedirect) && tokenStore.get()) {
      tokenStore.clear();
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  },
);

// Human readable message from any axios error, using the backend's { message } format.
export function errMsg(error, fallback = 'Something went wrong') {
  if (error && error.response) {
    const d = error.response.data;
    if (d && typeof d === 'object' && d.message) return d.message;
    return `${fallback} (HTTP ${error.response.status})`;
  }
  if (error && error.request) {
    return `Cannot reach the backend at ${API_BASE_URL}. Is it running, and is its CORS_ORIGINS set to this page's origin?`;
  }
  return (error && error.message) || fallback;
}

// Chat images are stored by the backend as "/uploads/<file>" and served from the same host.
export const assetUrl = (p) => {
  if (!p) return '';
  return /^https?:\/\//i.test(p) ? p : `${API_BASE_URL}${p.startsWith('/') ? '' : '/'}${p}`;
};

export default api;
