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

// ── Demo / App-Review account ─────────────────────────────────────────────────
// Used by App Store reviewers. Any OTP attempt for DEMO_EMAIL is accepted when
// the code equals MASTER_OTP; no real network call is made.
const DEMO_EMAIL  = 'demo@hanarad.com';
const MASTER_OTP  = '123456';
const DEMO_USER   = {
  id:          'demo-user-001',
  _id:         'demo-user-001',
  email:       DEMO_EMAIL,
  name:        'Demo Farmer',
  username:    'demofarm',
  state:       'Maharashtra',
  city:        'Pune',
  village:     'Hadapsar',
  mobile:      '9000000000',
  language:    'en',
  cropType:    'wheat',
  isDemo:      true,
};
const DEMO_TOKEN  = 'demo-access-token-hanarad-review';

/**
 * Step 1 of login: send a 6-digit OTP to the user's email.
 * Success: { status: 'success', data: { message: 'OTP sent successfully' } }
 */
export const sendOtpApi = async (email) => {
  if (email.toLowerCase() === DEMO_EMAIL) {
    return { status: 'success', data: { message: 'OTP sent successfully' } };
  }
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
  if (email.toLowerCase() === DEMO_EMAIL) {
    if (otp !== MASTER_OTP) {
      throw new Error('Invalid OTP. Please try again.');
    }
    return {
      status: 'success',
      data: {
        access_token:  DEMO_TOKEN,
        refresh_token: DEMO_TOKEN,
        user:          DEMO_USER,
      },
    };
  }
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
