import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { getComments, addComment, deleteComment } from './comments';

const BASE = 'https://api.realworld.show/api';

const mockComment = {
  id: 1,
  body: 'Great article!',
  createdAt: '2024-01-01T00:00:00.000Z',
  author: { username: 'user', bio: null, image: null, following: false },
};

describe('getComments', () => {
  it('fetches all comments for an article', async () => {
    server.use(
      http.get(`${BASE}/articles/test-slug/comments`, () =>
        HttpResponse.json({ comments: [mockComment] })
      )
    );
    const { data } = await getComments('test-slug');
    expect(data.comments).toHaveLength(1);
    expect(data.comments[0].body).toBe('Great article!');
  });
});

describe('addComment', () => {
  it('posts a comment and returns the new comment', async () => {
    server.use(
      http.post(`${BASE}/articles/test-slug/comments`, () =>
        HttpResponse.json({ comment: mockComment })
      )
    );
    const { data } = await addComment('test-slug', 'Great article!');
    expect(data.comment.id).toBe(1);
    expect(data.comment.body).toBe('Great article!');
  });
});

describe('deleteComment', () => {
  it('sends DELETE to the correct endpoint', async () => {
    let deleteCalled = false;
    server.use(
      http.delete(`${BASE}/articles/test-slug/comments/1`, () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 200 });
      })
    );
    await deleteComment('test-slug', 1);
    expect(deleteCalled).toBe(true);
  });
});
