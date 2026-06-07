import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      // No tokens at all — not logged in
      if (!accessToken && !refreshToken) {
        setLoading(false);
        return;
      }

      try {
        // Try fetching the current user with the existing access token
        const { data } = await api.get('/auth/me');
        setUser(data.data);
        setHasProfile(!!data.data.profile);
      } catch (err) {
        // Access token expired — try refreshing with the refresh token
        const isExpired =
          err.response?.status === 401 &&
          (err.response?.data?.code === 'TOKEN_EXPIRED' || !accessToken);

        if (isExpired && refreshToken) {
          try {
            const { data: refreshData } = await api.post('/auth/refresh', { refreshToken });
            localStorage.setItem('accessToken', refreshData.data.accessToken);
            localStorage.setItem('refreshToken', refreshData.data.refreshToken);

            // Retry fetching user with the new access token
            const { data } = await api.get('/auth/me');
            setUser(data.data);
            setHasProfile(!!data.data.profile);
          } catch {
            // Refresh token also invalid/expired — clear everything
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
          }
        } else {
          // Some other error (network, invalid token, etc.) — clear and log out
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setUser(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    setUser(data.data.user);
    setHasProfile(data.data.hasProfile);
    return data.data;
  };

  const signup = async (name, email, password) => {
    const { data } = await api.post('/auth/signup', { name, email, password });
    // If server returned tokens (auto-verified), log the user in
    if (data.data?.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      setUser(data.data.user);
      setHasProfile(data.data.hasProfile);
      return { ...data, autoLoggedIn: true };
    }
    // Otherwise user needs to verify email
    return { ...data, autoLoggedIn: false };
  };

  const googleLogin = async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    setUser(data.data.user);
    setHasProfile(data.data.hasProfile);
    return data.data;
  };

  const googleLoginDirect = async (accessToken, refreshToken, hasProfile) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    const { data } = await api.get('/auth/me');
    setUser(data.data);
    setHasProfile(hasProfile);
    return data.data;
  };

  const verifyEmail = async (token) => {
    const { data } = await api.post('/auth/verify-email', { token });
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    setUser(data.data.user);
    setHasProfile(data.data.hasProfile);
    return data.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Continue logout even if API fails
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setHasProfile(false);
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider value={{
      user,
      hasProfile,
      loading,
      isAuthenticated: !!user,
      login,
      signup,
      googleLogin,
      googleLoginDirect,
      verifyEmail,
      logout,
      refreshUser,
      setHasProfile,
    }}>
      {children}
    </AuthContext.Provider>

  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
