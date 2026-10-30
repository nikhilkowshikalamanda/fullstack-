// Remembers whether an administrator is signed in. The real protection is on the server;
// this only decides which screens React shows.
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me().then((r) => setAdmin(r.admin)).catch(() => setAdmin(null)).finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const r = await api.login(username, password);
    setAdmin(r.admin);
  };
  const logout = async () => {
    try { await api.logout(); } finally { setAdmin(null); }
  };
  const clearSession = () => setAdmin(null); // used when the server says the session expired

  return <AuthContext.Provider value={{ admin, loading, login, logout, clearSession }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
