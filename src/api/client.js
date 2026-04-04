// ══════════════════════════════════════════════════════
//  FABER.NET · src/api/client.js
// ══════════════════════════════════════════════════════
import axios from 'axios';

// Determine backend URL smartly:
// 1. If explicitly set in ENV, use it.
// 2. If frontend running on port 5173 (dev mode), point to backend at 4000.
// 3. Otherwise (tunnels or production static serving), use empty string for relative paths!
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL !== undefined 
  ? import.meta.env.VITE_BACKEND_URL 
  : (window.location.hostname === 'localhost' && window.location.port === '5173' ? 'http://localhost:4000' : '');

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `${BACKEND_URL}/api`,
  timeout: 15000,
});

// Attach JWT token automatically
API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('faber_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// On 401, clear session
API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('faber_token');
      localStorage.removeItem('faber_user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default API;
