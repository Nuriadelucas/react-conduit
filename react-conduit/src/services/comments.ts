import api from '../lib/api';
import type { Comment } from '../types';

export const getComments = (slug: string) =>
  api.get<{ comments: Comment[] }>(`/articles/${slug}/comments`);

export const addComment = (slug: string, body: string) =>
  api.post<{ comment: Comment }>(`/articles/${slug}/comments`, { comment: { body } });

export const deleteComment = (slug: string, commentId: number) =>
  api.delete(`/articles/${slug}/comments/${commentId}`);
