import axios from 'axios';
import { getToken, destroyToken } from './jwt';

const API_BASE = 'https://api.realworld.show/api';

const api = axios.create({ baseURL: API_BASE });

// tokenInterceptor equivalent
api.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

// errorInterceptor equivalent
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && !err.config.url?.endsWith('/user')) {
      destroyToken();
      window.location.href = '/login';
    }
    const body = err.response?.data?.errors
      ? err.response.data
      : { errors: { network: ['Unable to connect. Please check your internet connection.'] } };
    return Promise.reject({ ...body, status: err.response?.status });
  }
);

export default api;
