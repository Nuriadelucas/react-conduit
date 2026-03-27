import { describe, it, expect } from 'vitest';
import { parseMarkdown } from './markdown';

describe('parseMarkdown', () => {
  it('converts a heading to an <h1> tag', async () => {
    const result = await parseMarkdown('# Hello World');
    expect(result).toContain('<h1>Hello World</h1>');
  });

  it('converts bold text', async () => {
    const result = await parseMarkdown('**bold**');
    expect(result).toContain('<strong>bold</strong>');
  });

  it('converts a paragraph', async () => {
    const result = await parseMarkdown('Hello world');
    expect(result).toContain('<p>Hello world</p>');
  });

  it('strips <script> tags (XSS protection)', async () => {
    const result = await parseMarkdown('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
  });

  it('strips inline event handlers (XSS protection)', async () => {
    const result = await parseMarkdown('<img src="x" onerror="alert(1)" />');
    expect(result).not.toContain('onerror');
  });

  it('handles an empty string', async () => {
    const result = await parseMarkdown('');
    expect(result).toBe('');
  });
});
