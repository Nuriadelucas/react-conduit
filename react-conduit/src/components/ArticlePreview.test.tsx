import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { useAuth } from '../store/auth';
import { ArticlePreview } from './ArticlePreview';
import type { Article } from '../types';

vi.mock('../store/auth', () => ({ useAuth: vi.fn() }));

const API = 'https://api.realworld.show/api';

const mockArticle: Article = {
  slug: 'my-post',
  title: 'My Post',
  description: 'A description',
  body: 'Body',
  tagList: ['react', 'vitest'],
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
  favorited: false,
  favoritesCount: 3,
  author: { username: 'janedoe', bio: null, image: null, following: false },
};

const wrap = (article: Article = mockArticle) =>
  render(
    <MemoryRouter>
      <ArticlePreview article={article} />
    </MemoryRouter>
  );

describe('ArticlePreview', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'authenticated', currentUser: null, setAuth: vi.fn(), purgeAuth: vi.fn() });
  });

  it('renders the article title', () => {
    wrap();
    expect(screen.getByText('My Post')).toBeInTheDocument();
  });

  it('renders the article description', () => {
    wrap();
    expect(screen.getByText('A description')).toBeInTheDocument();
  });

  it('renders all tags', () => {
    wrap();
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('vitest')).toBeInTheDocument();
  });

  it('links to the article page', () => {
    wrap();
    const link = screen.getByRole('link', { name: /My Post/i });
    expect(link).toHaveAttribute('href', '/article/my-post');
  });

  it('renders the favorites count', () => {
    wrap();
    expect(screen.getByRole('button')).toHaveTextContent('3');
  });

  it('increments favorites count optimistically on favorite click', async () => {
    server.use(
      http.post(`${API}/articles/my-post/favorite`, () =>
        HttpResponse.json({ article: { ...mockArticle, favorited: true, favoritesCount: 4 } })
      )
    );
    wrap();
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('4'));
  });
});
