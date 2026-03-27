import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { getTags } from './tags';

const BASE = 'https://api.realworld.show/api';

describe('getTags', () => {
  it('fetches the list of popular tags', async () => {
    server.use(
      http.get(`${BASE}/tags`, () =>
        HttpResponse.json({ tags: ['react', 'angular', 'vue'] })
      )
    );
    const { data } = await getTags();
    expect(data.tags).toEqual(['react', 'angular', 'vue']);
  });

  it('returns an empty array when no tags exist', async () => {
    server.use(
      http.get(`${BASE}/tags`, () => HttpResponse.json({ tags: [] }))
    );
    const { data } = await getTags();
    expect(data.tags).toHaveLength(0);
  });
});
