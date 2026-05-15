const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Token management
export function getToken() {
  return localStorage.getItem('pollpulse_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('pollpulse_token', token);
  } else {
    localStorage.removeItem('pollpulse_token');
  }
}

// Request interceptors
const requestInterceptors = [];
const responseInterceptors = [];

export function onRequest(interceptor) {
  requestInterceptors.push(interceptor);
}

export function onResponse(interceptor) {
  responseInterceptors.push(interceptor);
}

// Core API function with interceptors
export async function api(path, options = {}) {
  let config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };

  // Apply request interceptors
  for (const interceptor of requestInterceptors) {
    config = await interceptor(config);
  }

  // Add auth token
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${path}`, config);
    
    let payload = {};
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      payload = await response.json();
    }

    // Handle errors
    if (!response.ok) {
      const error = new Error(payload.error || `HTTP ${response.status}`);
      error.status = response.status;
      error.data = payload;

      // Apply error interceptors
      for (const interceptor of responseInterceptors) {
        await interceptor(error);
      }

      throw error;
    }

    // Apply success interceptors
    for (const interceptor of responseInterceptors) {
      await interceptor(null, payload);
    }

    return payload;
  } catch (error) {
    // Network errors
    if (error instanceof TypeError) {
      const networkError = new Error('Network error. Please check your connection.');
      networkError.originalError = error;
      throw networkError;
    }
    throw error;
  }
}

// Convenience methods
export async function apiGet(path, options) {
  return api(path, { ...options, method: 'GET' });
}

export async function apiPost(path, data, options) {
  return api(path, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiPut(path, data, options) {
  return api(path, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiPatch(path, data, options) {
  return api(path, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function apiDelete(path, options) {
  return api(path, { ...options, method: 'DELETE' });
}

export { API_URL };
