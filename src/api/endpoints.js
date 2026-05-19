// All API endpoint paths — import from here, never hard-code in screens
export const ENDPOINTS = {
  // Auth
  SEND_OTP:    '/auth/send-otp',
  VERIFY_OTP:  '/auth/verify-otp',
  SIGNUP:      '/auth/signup',
  REFRESH:     '/auth/refresh-token',
  FORGOT_PWD:  '/auth/forgot-password',

  // Data / profile
  SUBMIT_DATA: '/mongo/submitdata',
  GET_DATA:    '/mongo/getdata',
};
