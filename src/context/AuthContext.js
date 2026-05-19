import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Storage, AuthStorage, KEYS } from '../utils/storage';
import { sendOtpApi, verifyOtpApi, signupApi } from '../api/authApi';
import { subscribeUserTopics, unsubscribeAllTopics } from '../services/notificationService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Bootstrap: restore session from storage ─────────────────────────────
  useEffect(() => { loadAuth(); }, []);

  const loadAuth = async () => {
    try {
      const storedToken = await AuthStorage.getAccessToken();
      const storedUser  = await AuthStorage.getUser();
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

  // ── Step 1: send OTP to email ────────────────────────────────────────────
  // Does not modify auth state — just fires the API and returns the result.
  const sendOtp = async (email) => {
    const result = await sendOtpApi(email);
    return result;
  };

  // ── Step 2: verify OTP → completes login ─────────────────────────────────
  // Replaces the old login(email, password) function.
  const login = async (email, otp) => {
    const result = await verifyOtpApi(email, otp);

    // Server returns: { status:'success', data:{ access_token, refresh_token, user } }
    const { access_token, refresh_token, user: userData } = result.data ?? result;

    // Normalise _id → id for consistency across the app
    const normUser = userData
      ? { ...userData, id: userData.id ?? userData._id }
      : { id: null, email };

    await AuthStorage.saveAccessToken(access_token);
    await AuthStorage.saveRefreshToken(refresh_token);
    await AuthStorage.saveUser(normUser);

    setToken(access_token);
    setUser(normUser);

    subscribeUserTopics({
      userId:   normUser.id   ?? '',
      village:  normUser.village  ?? '',
      cropType: normUser.cropType ?? 'general',
      language: normUser.language ?? 'en',
    }).catch(() => {});

    return normUser;
  };

  // ── Register: create account → auto-login ────────────────────────────────
  // API accepts { email, password, username }.
  // displayName is stored locally only (passed from form's name field).
  const register = async (email, password, username, displayName) => {
    const result = await signupApi(email, password, username);

    const { access_token, refresh_token, user: userData } = result.data ?? result;

    const normUser = userData
      ? { ...userData, id: userData.id ?? userData._id, name: displayName || userData.username || username }
      : { id: null, email, name: displayName || username };

    await AuthStorage.saveAccessToken(access_token);
    await AuthStorage.saveRefreshToken(refresh_token);
    await AuthStorage.saveUser(normUser);

    setToken(access_token);
    setUser(normUser);

    subscribeUserTopics({
      userId:   normUser.id   ?? '',
      village:  normUser.village  ?? '',
      cropType: normUser.cropType ?? 'general',
      language: normUser.language ?? 'en',
    }).catch(() => {});

    return normUser;
  };

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = async () => {
    await unsubscribeAllTopics().catch(() => {});
    await AuthStorage.clearAll();
    setToken(null);
    setUser(null);
  };

  // ── Update user (local state + storage only, no API call) ────────────────
  // API call happens in the screen; this just syncs the result into state.
  const updateUser = async (updatedFields) => {
    const merged = { ...user, ...updatedFields };
    await AuthStorage.saveUser(merged);
    setUser(merged);
    return merged;
  };

  // ── Profile completeness check ────────────────────────────────────────────
  // A profile is "complete" when the user has filled the key farming fields.
  // Used by useAuthFlow to decide whether to show ProfileSetup after login.
  const isProfileComplete = useCallback((u = user) => {
    if (!u) return false;
    return Boolean(u.state && u.city && (u.mobile || u.phone));
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isLoggedIn: Boolean(token),
        isProfileComplete,
        sendOtp,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
