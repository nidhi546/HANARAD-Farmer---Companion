import React, { createContext, useContext, useState, useEffect } from 'react';
import { Storage, KEYS } from '../utils/storage';
import { loginApi, registerApi } from '../api/authApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuth();
  }, []);

  const loadAuth = async () => {
    try {
      const storedToken = await Storage.get(KEYS.AUTH_TOKEN);
      const storedUser = await Storage.get(KEYS.AUTH_USER);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
    } catch (e) {
      console.log('Auth load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await loginApi(email, password);
    await Storage.set(KEYS.AUTH_TOKEN, data.token);
    await Storage.set(KEYS.AUTH_USER, data.user);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, phone, password) => {
    const data = await registerApi(name, email, phone, password);
    await Storage.set(KEYS.AUTH_TOKEN, data.token);
    await Storage.set(KEYS.AUTH_USER, data.user);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await Storage.multiRemove([KEYS.AUTH_TOKEN, KEYS.AUTH_USER]);
    setToken(null);
    setUser(null);
  };

  const updateUser = async (updatedFields) => {
    const merged = { ...user, ...updatedFields };
    await Storage.set(KEYS.AUTH_USER, merged);
    setUser(merged);
    return merged;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
