import api from '../lib/api';
import type { Profile } from '../types';

export const getProfile = (username: string) =>
  api.get<{ profile: Profile }>(`/profiles/${username}`);

export const followUser = (username: string) =>
  api.post<{ profile: Profile }>(`/profiles/${username}/follow`, {});

export const unfollowUser = (username: string) =>
  api.delete<{ profile: Profile }>(`/profiles/${username}/follow`);
