import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import {
  queryArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  favoriteArticle,
  unfavoriteArticle,
} from './articles';

const BASE = 'https://api.realworld.show/api';

const mockArticle = {
  slug: 'test-article',
  title: 'Test Article',
  description: 'A test article',
  body: '# Hello',
  tagList: ['test'],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  favorited: false,
  favoritesCount: 0,
  author: { username: 'user', bio: null, image: null, following: false },
};

describe('queryArticles', () => {
  it('fetches global articles from /articles', async () => {
    server.use(
      http.get(`${BASE}/articles`, () =>
        HttpResponse.json({ articles: [mockArticle], articlesCount: 1 })
      )
    );
    const { data } = await queryArticles({ type: 'all', filters: {} });
    expect(data.articlesCount).toBe(1);
    expect(data.articles[0].slug).toBe('test-article');
  });

  it('fetches personal feed from /articles/feed when type is feed', async () => {
    let feedCalled = false;
    server.use(
      http.get(`${BASE}/articles/feed`, () => {
        feedCalled = true;
        return HttpResponse.json({ articles: [], articlesCount: 0 });
      })
    );
    await queryArticles({ type: 'feed', filters: {} });
    expect(feedCalled).toBe(true);
  });

  it('passes tag filter as a query parameter', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/articles`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ articles: [], articlesCount: 0 });
      })
    );
    await queryArticles({ type: 'all', filters: { tag: 'react' } });
    expect(capturedUrl).toContain('tag=react');
  });
});

describe('getArticle', () => {
  it('fetches a single article by slug', async () => {
    server.use(
      http.get(`${BASE}/articles/test-article`, () =>
        HttpResponse.json({ article: mockArticle })
      )
    );
    const { data } = await getArticle('test-article');
    expect(data.article.title).toBe('Test Article');
  });
});

describe('createArticle', () => {
  it('posts to /articles and returns the new article', async () => {
    server.use(
      http.post(`${BASE}/articles`, () => HttpResponse.json({ article: mockArticle }))
    );
    const { data } = await createArticle({
      title: 'Test Article',
      description: 'A test article',
      body: '# Hello',
      tagList: ['test'],
    });
    expect(data.article.slug).toBe('test-article');
  });
});

describe('updateArticle', () => {
  it('puts to /articles/:slug and returns the updated article', async () => {
    const updated = { ...mockArticle, title: 'Updated Title' };
    server.use(
      http.put(`${BASE}/articles/test-article`, () =>
        HttpResponse.json({ article: updated })
      )
    );
    const { data } = await updateArticle({ slug: 'test-article', title: 'Updated Title' });
    expect(data.article.title).toBe('Updated Title');
  });
});

describe('deleteArticle', () => {
  it('sends DELETE to /articles/:slug', async () => {
    let deleteCalled = false;
    server.use(
      http.delete(`${BASE}/articles/test-article`, () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 200 });
      })
    );
    await deleteArticle('test-article');
    expect(deleteCalled).toBe(true);
  });
});

describe('favoriteArticle', () => {
  it('posts to /articles/:slug/favorite and returns updated article', async () => {
    const favorited = { ...mockArticle, favorited: true, favoritesCount: 1 };
    server.use(
      http.post(`${BASE}/articles/test-article/favorite`, () =>
        HttpResponse.json({ article: favorited })
      )
    );
    const { data } = await favoriteArticle('test-article');
    expect(data.article.favorited).toBe(true);
    expect(data.article.favoritesCount).toBe(1);
  });
});

describe('unfavoriteArticle', () => {
  it('deletes /articles/:slug/favorite and returns updated article', async () => {
    server.use(
      http.delete(`${BASE}/articles/test-article/favorite`, () =>
        HttpResponse.json({ article: mockArticle })
      )
    );
    const { data } = await unfavoriteArticle('test-article');
    expect(data.article.favorited).toBe(false);
  });
});
