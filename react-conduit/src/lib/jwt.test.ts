import { describe, it, expect, beforeEach } from 'vitest';
import { getToken, saveToken, destroyToken } from './jwt';

describe('JWT helpers', () => {
  beforeEach(() => localStorage.clear());

  it('getToken returns null when no token is stored', () => {
    expect(getToken()).toBeNull();
  });

  it('saveToken persists the token', () => {
    saveToken('abc123');
    expect(localStorage.getItem('jwtToken')).toBe('abc123');
  });

  it('getToken returns the stored token', () => {
    saveToken('my-token');
    expect(getToken()).toBe('my-token');
  });

  it('destroyToken removes the token', () => {
    saveToken('my-token');
    destroyToken();
    expect(getToken()).toBeNull();
  });

  it('saveToken overwrites a previously stored token', () => {
    saveToken('token-one');
    saveToken('token-two');
    expect(getToken()).toBe('token-two');
  });
});
