import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { login, register, updateUser } from './user';

const BASE = 'https://api.realworld.show/api';

const mockUser = {
  email: 'test@example.com',
  token: 'test-token',
  username: 'testuser',
  bio: null,
  image: null,
};

describe('login', () => {
  it('posts credentials to /users/login and returns the user', async () => {
    server.use(
      http.post(`${BASE}/users/login`, () => HttpResponse.json({ user: mockUser }))
    );
    const { data } = await login({ email: 'test@example.com', password: 'password' });
    expect(data.user.username).toBe('testuser');
    expect(data.user.token).toBe('test-token');
  });

  it('rejects with normalized errors on 422', async () => {
    server.use(
      http.post(`${BASE}/users/login`, () =>
        HttpResponse.json(
          { errors: { 'email or password': ['is invalid'] } },
          { status: 422 }
        )
      )
    );
    await expect(login({ email: 'bad@example.com', password: 'wrong' })).rejects.toMatchObject({
      errors: { 'email or password': ['is invalid'] },
      status: 422,
    });
  });
});

describe('register', () => {
  it('posts to /users and returns the new user', async () => {
    server.use(
      http.post(`${BASE}/users`, () => HttpResponse.json({ user: mockUser }))
    );
    const { data } = await register({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password',
    });
    expect(data.user.username).toBe('testuser');
  });

  it('rejects with errors when username is taken', async () => {
    server.use(
      http.post(`${BASE}/users`, () =>
        HttpResponse.json(
          { errors: { username: ['has already been taken'] } },
          { status: 422 }
        )
      )
    );
    await expect(
      register({ username: 'taken', email: 'x@example.com', password: 'pass' })
    ).rejects.toMatchObject({ errors: { username: ['has already been taken'] } });
  });
});

describe('updateUser', () => {
  it('puts updated fields to /user and returns the updated user', async () => {
    const updated = { ...mockUser, bio: 'New bio' };
    server.use(
      http.put(`${BASE}/user`, () => HttpResponse.json({ user: updated }))
    );
    const { data } = await updateUser({ bio: 'New bio' });
    expect(data.user.bio).toBe('New bio');
  });
});
