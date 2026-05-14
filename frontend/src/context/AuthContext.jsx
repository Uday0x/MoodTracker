import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, setToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/auth/me')
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  async function authenticate(mode, form) {
    const payload = await api(`/auth/${mode}`, {
      method: 'POST',
      body: JSON.stringify(form)
    });
    setToken(payload.token);
    setUser(payload.user);
    return payload.user;
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, authenticate, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
