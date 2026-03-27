import api from '../lib/api';
import type { User } from '../types';

export const login = (credentials: { email: string; password: string }) =>
  api.post<{ user: User }>('/users/login', { user: credentials });

export const register = (credentials: { username: string; email: string; password: string }) =>
  api.post<{ user: User }>('/users', { user: credentials });

export const updateUser = (user: Partial<User> & { password?: string }) =>
  api.put<{ user: User }>('/user', { user });
