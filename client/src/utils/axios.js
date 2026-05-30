import axios from 'axios';

/**
 * Axios Instance with JWT Interceptor
 *
 * Base URL points to backend API.
 * Request interceptor automatically attaches JWT token.
 * Response interceptor handles 401 errors (expired/invalid token).
 */
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor — Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor — Handle 401 (unauthorized) globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired — clean up
      localStorage.removeItem('token');
      // Redirect to login if not already there
      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/admin/login'
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
