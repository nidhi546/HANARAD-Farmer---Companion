// API-ready auth module.
// Replace BASE_URL and uncomment the fetch calls when your backend is ready.
// const BASE_URL = 'https://your-api.com/api';

export const loginApi = async (email, password) => {
  // --- Real API (uncomment when backend ready) ---
  // const res = await fetch(`${BASE_URL}/auth/login`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ email, password }),
  // });
  // const data = await res.json();
  // if (!res.ok) throw new Error(data.message || 'Login failed');
  // return data; // { token, user: { id, name, email, phone } }

  // --- Mock implementation ---
  await new Promise(r => setTimeout(r, 800)); // simulate network delay
  if (email && password) {
    return {
      token: 'mock_token_' + Date.now(),
      user: { id: '1', name: 'Farmer', email, phone: '' },
    };
  }
  throw new Error('Invalid credentials');
};

export const registerApi = async (name, email, phone, password) => {
  // --- Real API ---
  // const res = await fetch(`${BASE_URL}/auth/register`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ name, email, phone, password }),
  // });
  // const data = await res.json();
  // if (!res.ok) throw new Error(data.message || 'Registration failed');
  // return data;

  // --- Mock ---
  await new Promise(r => setTimeout(r, 800));
  return {
    token: 'mock_token_' + Date.now(),
    user: { id: '1', name, email, phone },
  };
};

export const forgotPasswordApi = async (email) => {
  // --- Real API ---
  // const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ email }),
  // });
  // if (!res.ok) throw new Error('Failed to send reset email');

  // --- Mock ---
  await new Promise(r => setTimeout(r, 600));
  return true;
};
