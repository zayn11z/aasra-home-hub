import axios from 'axios';

export const BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';

const api = axios.create({
  baseURL: `${BASE_URL}/api`, // Pointing to our Express backend
});

// Add a request interceptor to attach the JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
