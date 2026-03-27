import api from '../lib/api';
import type { User } from '../types';

/**
 * Authenticate with email + password.
 * Maps to Angular UserService.login() → POST /users/login
 */
export const login = (credentials: { email: string; password: string }) =>
  api.post<{ user: User }>('/users/login', { user: credentials });

/**
 * Create a new account.
 * Maps to Angular UserService.register() → POST /users
 */
export const register = (credentials: { username: string; email: string; password: string }) =>
  api.post<{ user: User }>('/users', { user: credentials });

/**
 * Fetch the currently authenticated user using the stored JWT.
 * Maps to Angular UserService.getCurrentUser() → GET /user
 * Used on app boot to rehydrate auth state from localStorage.
 */
export const getCurrentUser = () =>
  api.get<{ user: User }>('/user');

/**
 * Update profile settings for the authenticated user.
 * Maps to Angular UserService.update() → PUT /user
 */
export const updateUser = (user: Partial<User> & { password?: string }) =>
  api.put<{ user: User }>('/user', { user });
