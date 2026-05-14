const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function getToken() {
  return localStorage.getItem('pollpulse_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('pollpulse_token', token);
  else localStorage.removeItem('pollpulse_token');
}

export async function api(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Request failed.');
  return payload;
}

export { API_URL };
