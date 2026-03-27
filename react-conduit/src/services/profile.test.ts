import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { getProfile, followUser, unfollowUser } from './profile';

const BASE = 'https://api.realworld.show/api';

const mockProfile = {
  username: 'janedoe',
  bio: 'Hello world',
  image: null,
  following: false,
};

describe('getProfile', () => {
  it('fetches a user profile by username', async () => {
    server.use(
      http.get(`${BASE}/profiles/janedoe`, () =>
        HttpResponse.json({ profile: mockProfile })
      )
    );
    const { data } = await getProfile('janedoe');
    expect(data.profile.username).toBe('janedoe');
    expect(data.profile.following).toBe(false);
  });
});

describe('followUser', () => {
  it('posts to /profiles/:username/follow and returns profile with following: true', async () => {
    server.use(
      http.post(`${BASE}/profiles/janedoe/follow`, () =>
        HttpResponse.json({ profile: { ...mockProfile, following: true } })
      )
    );
    const { data } = await followUser('janedoe');
    expect(data.profile.following).toBe(true);
  });
});

describe('unfollowUser', () => {
  it('deletes /profiles/:username/follow and returns profile with following: false', async () => {
    server.use(
      http.delete(`${BASE}/profiles/janedoe/follow`, () =>
        HttpResponse.json({ profile: { ...mockProfile, following: false } })
      )
    );
    const { data } = await unfollowUser('janedoe');
    expect(data.profile.following).toBe(false);
  });
});
