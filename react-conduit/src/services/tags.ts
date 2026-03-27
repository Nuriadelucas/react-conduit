import api from '../lib/api';

export const getTags = () =>
  api.get<{ tags: string[] }>('/tags');
