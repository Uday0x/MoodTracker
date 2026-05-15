import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      const { user: currentUser } = await api('/auth/me');
      setUser(currentUser);
      setError(null);
    } catch (err) {
      setToken(null);
      setUser(null);
      setError(null); // Don't show error on initial load
    } finally {
      setLoading(false);
    }
  }, []);

  const authenticate = useCallback(async (mode, credentials) => {
    try {
      setError(null);
      const payload = await api(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      setToken(payload.token);
      setUser(payload.user);
      return payload.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  const isAuthenticated = useMemo(() => !!user, [user]);

  const value = useMemo(() => ({
    user,
    loading,
    error,
    isAuthenticated,
    authenticate,
    logout,
    initializeAuth,
  }), [user, loading, error, isAuthenticated, authenticate, logout, initializeAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
