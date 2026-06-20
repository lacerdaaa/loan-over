import axios from 'axios';
import { clearToken, getToken } from '../lib/auth';

export const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
});

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);
