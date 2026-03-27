import api from '../lib/api';
import type { Article, ArticleListConfig } from '../types';

export const queryArticles = (config: ArticleListConfig) => {
  const params: Record<string, string | number> = {};
  const { filters } = config;
  if (filters.tag) params['tag'] = filters.tag;
  if (filters.author) params['author'] = filters.author;
  if (filters.favorited) params['favorited'] = filters.favorited;
  if (filters.limit !== undefined) params['limit'] = filters.limit;
  if (filters.offset !== undefined) params['offset'] = filters.offset;
  const url = config.type === 'feed' ? '/articles/feed' : '/articles';
  return api.get<{ articles: Article[]; articlesCount: number }>(url, { params });
};

export const getArticle = (slug: string) =>
  api.get<{ article: Article }>(`/articles/${slug}`);

export const createArticle = (article: Partial<Article>) =>
  api.post<{ article: Article }>('/articles', { article });

export const updateArticle = (article: Partial<Article>) =>
  api.put<{ article: Article }>(`/articles/${article.slug}`, { article });

export const deleteArticle = (slug: string) =>
  api.delete(`/articles/${slug}`);

export const favoriteArticle = (slug: string) =>
  api.post<{ article: Article }>(`/articles/${slug}/favorite`, {});

export const unfavoriteArticle = (slug: string) =>
  api.delete(`/articles/${slug}/favorite`);
