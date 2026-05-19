/**
 * Auth API — Send OTP · Verify OTP · Sign Up · Forgot Password
 *
 * Every function returns the `data` envelope from the server response:
 *   { status: 'success', data: { ... } }
 *
 * API-level errors (status: 'error') are already converted to thrown Errors
 * by the axiosInstance response interceptor, so callers only need one catch.
 */
import api from './axiosInstance';
import { ENDPOINTS } from './endpoints';
import { APP_NAME } from './baseUrl';

/**
 * Step 1 of login: send a 6-digit OTP to the user's email.
 * Success: { status: 'success', data: { message: 'OTP sent successfully' } }
 */
export const sendOtpApi = async (email) => {
  const { data } = await api.post(ENDPOINTS.SEND_OTP, {
    appName:    APP_NAME,
    identifier: email,
  });
  return data;
};

/**
 * Step 2 of login: verify the OTP and receive auth tokens.
 * Success: { status: 'success', data: { access_token, refresh_token, user } }
 */
export const verifyOtpApi = async (email, otp) => {
  const { data } = await api.post(ENDPOINTS.VERIFY_OTP, {
    appName:    APP_NAME,
    identifier: email,
    otp,
  });
  return data;
};

/**
 * Register a new account.
 * Success: { status: 'success', data: { access_token, refresh_token, user } }
 */
export const signupApi = async (email, password, username) => {
  const { data } = await api.post(ENDPOINTS.SIGNUP, {
    appName:  APP_NAME,
    email,
    password,
    username,
  });
  return data;
};

/**
 * Initiate a password-reset flow (sends OTP / magic link).
 */
export const forgotPasswordApi = async (email) => {
  const { data } = await api.post(ENDPOINTS.FORGOT_PWD, {
    appName:    APP_NAME,
    identifier: email,
  });
  return data;
};
