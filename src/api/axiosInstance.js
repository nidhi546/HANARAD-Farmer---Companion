/**
 * Axios instance — single source of truth for all HTTP calls.
 *
 * Request interceptor  : attaches Bearer token from AsyncStorage.
 * Response interceptor : surfaces API-level errors, handles 401 token
 *                        refresh with request queuing, formats error messages.
 */
import axios from 'axios';
import { BASE_URL, APP_NAME } from './baseUrl';
import { ENDPOINTS } from './endpoints';
import { AuthStorage } from '../utils/storage';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ── Request: attach access token ──────────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await AuthStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response: error handling + silent token refresh ───────────────────────────
let isRefreshing   = false;
let pendingQueue   = [];

function flushQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token),
  );
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => {
    // Treat API-level { status: 'error' } as a thrown error so callers only
    // need a single catch block.
    const d = response.data;
    if (d && d.status === 'error') {
      const msg = d.message || d.data?.message || 'Request failed.';
      return Promise.reject(new Error(msg));
    }
    return response;
  },
  async (error) => {
    const original = error.config;

    // ── 401: try refresh once, queue concurrent requests ──────────────────
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) =>
          pendingQueue.push({ resolve, reject }),
        ).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry  = true;
      isRefreshing     = true;

      try {
        const refreshToken = await AuthStorage.getRefreshToken();
        if (!refreshToken) throw new Error('Session expired.');

        const { data } = await axios.post(`${BASE_URL}${ENDPOINTS.REFRESH}`, {
          appName: APP_NAME,
          refreshToken,
        });

        const newToken = data?.data?.access_token ?? data?.access_token;
        if (!newToken) throw new Error('Could not refresh session.');

        await AuthStorage.saveAccessToken(newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        flushQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        await AuthStorage.clearAll();
        // AuthContext will detect empty token on next render → redirect to Login
        return Promise.reject(new Error('Session expired. Please log in again.'));
      } finally {
        isRefreshing = false;
      }
    }

    // ── Format network / timeout / server errors into readable messages ────
    if (!error.response) {
      error.message =
        error.code === 'ECONNABORTED'
          ? 'Request timed out. Check your internet connection.'
          : 'Network error. Please check your connection and try again.';
    } else {
      const body = error.response.data;
      error.message =
        body?.message || body?.data?.message || body?.error || error.message || 'Something went wrong.';
    }

    return Promise.reject(error);
  },
);

export default api;
