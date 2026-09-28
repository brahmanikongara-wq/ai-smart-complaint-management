import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('resolvai_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('resolvai_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(
            `${API_URL}/api/v1/auth/refresh-token`,
            { refreshToken }
          );
          if (res.data.success) {
            localStorage.setItem('resolvai_token', res.data.data.accessToken);
            localStorage.setItem('resolvai_refresh_token', res.data.data.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
            return api(originalRequest);
          }
        } catch {
          localStorage.removeItem('resolvai_token');
          localStorage.removeItem('resolvai_refresh_token');
          localStorage.removeItem('resolvai_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
