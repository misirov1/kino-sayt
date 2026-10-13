import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { getSocket } from '../utils/socket';

const AuthContext = createContext();

function getStoredGuestUser() {
  const saved = localStorage.getItem('kinoverse_guest_user');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  const guestNum = Math.floor(100 + Math.random() * 900);
  const guest = {
    id: 'usr_guest_' + Math.random().toString(36).slice(2, 10),
    name: 'Mehmon ' + guestNum,
    username: 'mehmon_' + guestNum,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    role: 'user'
  };
  localStorage.setItem('kinoverse_guest_user', JSON.stringify(guest));
  return guest;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('kinoverse_token'));
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem('kinoverse_token');
    return t ? null : getStoredGuestUser();
  });
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Load user data on startup if token exists
  useEffect(() => {
    async function loadMe() {
      if (!token) {
        setUser(getStoredGuestUser());
        setLoading(false);
        return;
      }
      try {
        const userData = await apiFetch('/auth/me');
        setUser(userData);
        const socket = getSocket();
        socket.emit('register_user', userData);
      } catch (err) {
        console.warn('Seans tugagan yoki token yaroqsiz:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    }
    loadMe();
  }, [token]);

  const handleAuthSuccess = (data) => {
    localStorage.setItem('kinoverse_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setIsAuthModalOpen(false);

    const socket = getSocket();
    socket.emit('register_user', data.user);
  };

  const login = async (email, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    handleAuthSuccess(data);
    return data;
  };

  const register = async (formData) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: formData
    });
    handleAuthSuccess(data);
    return data;
  };

  const googleLogin = async (payload) => {
    const data = await apiFetch('/auth/google', {
      method: 'POST',
      body: payload
    });
    handleAuthSuccess(data);
    return data;
  };

  const loginGuest = async () => {
    try {
      const data = await apiFetch('/auth/guest', { method: 'POST' });
      handleAuthSuccess(data);
      return data.user;
    } catch (err) {
      const guestUser = getStoredGuestUser();
      setUser(guestUser);
      return guestUser;
    }
  };

  const logout = () => {
    localStorage.removeItem('kinoverse_token');
    setToken(null);
    setUser(getStoredGuestUser());
  };

  const updateProfile = async (updates) => {
    const data = await apiFetch('/auth/profile', {
      method: 'PUT',
      body: updates
    });
    if (data.user) {
      setUser(prev => ({ ...prev, ...data.user }));
    }
    return data;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user && ['super_admin', 'admin'].includes(user.role),
    isSuperAdmin: user && user.role === 'super_admin',
    isModerator: user && ['super_admin', 'admin', 'moderator'].includes(user.role),
    login,
    register,
    googleLogin,
    loginGuest,
    logout,
    updateProfile,
    isAuthModalOpen,
    setIsAuthModalOpen
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
