import { describe, it, expect } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { AuthProvider, useAuth } from './auth';
import type { ReactNode } from 'react';

const BASE = 'https://api.realworld.show/api';

const mockUser = {
  email: 'test@example.com',
  token: 'valid-token',
  username: 'testuser',
  bio: null,
  image: null,
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth — no token', () => {
  it('transitions to unauthenticated when no token is in localStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.authState).toBe('unauthenticated'));
    expect(result.current.currentUser).toBeNull();
  });
});

describe('useAuth — valid token', () => {
  it('transitions to authenticated when GET /user succeeds', async () => {
    localStorage.setItem('jwtToken', 'valid-token');
    server.use(
      http.get(`${BASE}/user`, () => HttpResponse.json({ user: mockUser }))
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.authState).toBe('authenticated'));
    expect(result.current.currentUser?.username).toBe('testuser');
  });
});

describe('useAuth — invalid token', () => {
  it('transitions to unauthenticated when GET /user returns 401', async () => {
    localStorage.setItem('jwtToken', 'expired-token');
    server.use(
      http.get(`${BASE}/user`, () =>
        HttpResponse.json({ errors: { token: ['is invalid'] } }, { status: 401 })
      )
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.authState).toBe('unauthenticated'));
    expect(result.current.currentUser).toBeNull();
  });

  it('transitions to unavailable when GET /user returns a server error', async () => {
    localStorage.setItem('jwtToken', 'some-token');
    server.use(
      http.get(`${BASE}/user`, () =>
        new HttpResponse(null, { status: 500 })
      )
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.authState).toBe('unavailable'));
  });
});

describe('setAuth', () => {
  it('sets the user and transitions to authenticated', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.authState).toBe('unauthenticated'));
    act(() => result.current.setAuth(mockUser));
    expect(result.current.authState).toBe('authenticated');
    expect(result.current.currentUser?.username).toBe('testuser');
    expect(localStorage.getItem('jwtToken')).toBe('valid-token');
  });
});

describe('purgeAuth', () => {
  it('clears the user and transitions to unauthenticated', async () => {
    localStorage.setItem('jwtToken', 'valid-token');
    server.use(
      http.get(`${BASE}/user`, () => HttpResponse.json({ user: mockUser }))
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.authState).toBe('authenticated'));
    act(() => result.current.purgeAuth());
    expect(result.current.authState).toBe('unauthenticated');
    expect(result.current.currentUser).toBeNull();
    expect(localStorage.getItem('jwtToken')).toBeNull();
  });
});
