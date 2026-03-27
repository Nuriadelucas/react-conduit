import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

describe('useAuth — retry on unavailable', () => {
  // Use fake timers for these tests, but advance via advanceTimersByTimeAsync
  // (which also drains microtasks) instead of waitFor (which relies on real setTimeout).
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('retries after 5 s and transitions to authenticated on success', async () => {
    localStorage.setItem('jwtToken', 'some-token');
    let callCount = 0;
    server.use(
      http.get(`${BASE}/user`, () => {
        callCount++;
        if (callCount === 1) return new HttpResponse(null, { status: 503 });
        return HttpResponse.json({ user: mockUser });
      })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Flush the initial request + React state update (no timers involved)
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(result.current.authState).toBe('unavailable');

    // Fire the 5 s retry timer and flush its response
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(result.current.authState).toBe('authenticated');
    expect(result.current.currentUser?.username).toBe('testuser');
    expect(callCount).toBe(2);
  });

  it('stays unavailable if the retry also fails', async () => {
    localStorage.setItem('jwtToken', 'some-token');
    server.use(
      http.get(`${BASE}/user`, () => new HttpResponse(null, { status: 503 }))
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(result.current.authState).toBe('unavailable');

    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(result.current.authState).toBe('unavailable');
  });

  it('transitions to unauthenticated if a retry returns 401', async () => {
    localStorage.setItem('jwtToken', 'some-token');
    let callCount = 0;
    server.use(
      http.get(`${BASE}/user`, () => {
        callCount++;
        if (callCount === 1) return new HttpResponse(null, { status: 503 });
        return HttpResponse.json({ errors: { token: ['is invalid'] } }, { status: 401 });
      })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(result.current.authState).toBe('unavailable');

    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(result.current.authState).toBe('unauthenticated');
    expect(result.current.currentUser).toBeNull();
  });

  it('uses exponential backoff: 5 s then 10 s between retries', async () => {
    localStorage.setItem('jwtToken', 'some-token');
    let callCount = 0;
    server.use(
      http.get(`${BASE}/user`, () => {
        callCount++;
        if (callCount < 3) return new HttpResponse(null, { status: 503 });
        return HttpResponse.json({ user: mockUser });
      })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initial request fails
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(result.current.authState).toBe('unavailable');
    expect(callCount).toBe(1);

    // First retry after 5 s — still fails
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(result.current.authState).toBe('unavailable');
    expect(callCount).toBe(2);

    // Second retry after 10 s — succeeds
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(result.current.authState).toBe('authenticated');
    expect(callCount).toBe(3);
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
