// ══════════════════════════════════════════════════════
//  FABER.NET · src/context/AuthContext.jsx
// ══════════════════════════════════════════════════════
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import API from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('faber_user')); } catch { return null; } });
  const [token, setToken] = useState(() => localStorage.getItem('faber_token'));
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);

  useEffect(() => {
    if (user?.role === 'demo') setIsDemo(true);
    if (token) {
      API.get('/auth/me').then(({ data }) => {
        setUser(data);
        if (data.role === 'demo') setIsDemo(true);
        localStorage.setItem('faber_user', JSON.stringify(data));
      }).catch(() => {});
    }
  }, [token]);

  const login = useCallback(async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    localStorage.setItem('faber_token', data.token);
    localStorage.setItem('faber_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    if (data.user.role === 'demo') setIsDemo(true);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password, department) => {
    const { data } = await API.post('/auth/register', { name, email, password, department });
    localStorage.setItem('faber_token', data.token);
    localStorage.setItem('faber_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const demoLogin = useCallback(async (email) => {
    const { data } = await API.post('/auth/demo', { email });
    localStorage.setItem('faber_token', data.token);
    localStorage.setItem('faber_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = () => {
    localStorage.removeItem('faber_token');
    localStorage.removeItem('faber_user');
    localStorage.removeItem('faber_demo');
    setUser(null);
    setToken(null);
    setIsDemo(false);
    delete API.defaults.headers.common['Authorization'];
  };

  const updateUser = useCallback((updated) => {
    const merged = { ...user, ...updated };
    localStorage.setItem('faber_user', JSON.stringify(merged));
    setUser(merged);
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, token, loading, isDemo, login, register, demoLogin, logout, updateUser, chatTarget, setChatTarget,
      isAdmin: user?.role === 'admin' || user?.role === 'ROOT_ADMIN'
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
