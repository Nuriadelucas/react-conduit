import { describe, it, expect } from 'vitest';
import { defaultImage } from './defaultImage';

const FALLBACK = '/assets/default-avatar.svg';

describe('defaultImage', () => {
  it('returns the image URL when a valid URL is given', () => {
    expect(defaultImage('https://example.com/avatar.jpg')).toBe('https://example.com/avatar.jpg');
  });

  it('returns the fallback for null', () => {
    expect(defaultImage(null)).toBe(FALLBACK);
  });

  it('returns the fallback for undefined', () => {
    expect(defaultImage(undefined)).toBe(FALLBACK);
  });

  it('returns the fallback for an empty string', () => {
    expect(defaultImage('')).toBe(FALLBACK);
  });
});
