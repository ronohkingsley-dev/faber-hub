// ══════════════════════════════════════════════════════
//  FABER.NET · src/api/client.js
// ══════════════════════════════════════════════════════
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
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
