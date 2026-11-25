import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, onUnauthorized, tokenStore } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [lab, setLab] = useState(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    tokenStore.set(null);
    setUser(null);
    setLab(null);
  }, []);

  useEffect(() => {
    onUnauthorized(logout);
    if (!tokenStore.get()) {
      setReady(true);
      return;
    }
    api('/auth/me')
      .then((d) => {
        setUser(d.user);
        setLab(d.lab || null);
      })
      .catch(() => logout())
      .finally(() => setReady(true));
  }, [logout]);

  const handleAuth = useCallback((d) => {
    tokenStore.set(d.token);
    setUser(d.user);
    setLab(d.lab || null);
    return d.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      lab,
      ready,
      setUser,
      setLab,
      logout,
      login: (email, password) => api('/auth/login', { method: 'POST', body: { email, password } }).then(handleAuth),
      register: (body) => api('/auth/register', { method: 'POST', body }).then(handleAuth),
    }),
    [user, lab, ready, logout, handleAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export function homeFor(user) {
  if (user?.role === 'admin') return '/admin';
  if (user?.role === 'lab') return '/partner';
  if (user?.role === 'collector') return '/collector';
  return '/';
}
