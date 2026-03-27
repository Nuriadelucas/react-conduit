import { marked } from 'marked';
import DOMPurify from 'dompurify';

export async function parseMarkdown(content: string): Promise<string> {
  return DOMPurify.sanitize(await marked.parse(content));
}
