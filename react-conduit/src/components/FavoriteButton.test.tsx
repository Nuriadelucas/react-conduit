import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { useAuth } from '../store/auth';
import { FavoriteButton } from './FavoriteButton';
import type { Article } from '../types';

vi.mock('../store/auth', () => ({ useAuth: vi.fn() }));

const API = 'https://api.realworld.show/api';

const makeArticle = (favorited = false): Article => ({
  slug: 'test-article',
  title: 'Test',
  description: 'Desc',
  body: 'Body',
  tagList: [],
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
  favorited,
  favoritesCount: 5,
  author: { username: 'author', bio: null, image: null, following: false },
});

const wrap = (article: Article, onToggle = vi.fn()) =>
  render(
    <MemoryRouter>
      <FavoriteButton article={article} onToggle={onToggle} />
    </MemoryRouter>
  );

describe('FavoriteButton — not favorited', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'authenticated', currentUser: null, setAuth: vi.fn(), purgeAuth: vi.fn() });
  });

  it('shows btn-outline-primary class', () => {
    wrap(makeArticle(false));
    expect(screen.getByRole('button')).toHaveClass('btn-outline-primary');
  });

  it('shows the favorites count', () => {
    wrap(makeArticle(false));
    expect(screen.getByRole('button')).toHaveTextContent('5');
  });
});

describe('FavoriteButton — favorited', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'authenticated', currentUser: null, setAuth: vi.fn(), purgeAuth: vi.fn() });
  });

  it('shows btn-primary class', () => {
    wrap(makeArticle(true));
    expect(screen.getByRole('button')).toHaveClass('btn-primary');
  });
});

describe('FavoriteButton — unauthenticated', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'unauthenticated', currentUser: null, setAuth: vi.fn(), purgeAuth: vi.fn() });
  });

  it('does not call onToggle when clicked (navigates instead)', () => {
    const onToggle = vi.fn();
    wrap(makeArticle(false), onToggle);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).not.toHaveBeenCalled();
  });
});

describe('FavoriteButton — authenticated toggle', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'authenticated', currentUser: null, setAuth: vi.fn(), purgeAuth: vi.fn() });
  });

  it('calls onToggle(true) after favoriting', async () => {
    server.use(
      http.post(`${API}/articles/test-article/favorite`, () =>
        HttpResponse.json({ article: { ...makeArticle(true), favoritesCount: 6 } })
      )
    );
    const onToggle = vi.fn();
    wrap(makeArticle(false), onToggle);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(onToggle).toHaveBeenCalledWith(true));
  });

  it('calls onToggle(false) after unfavoriting', async () => {
    server.use(
      http.delete(`${API}/articles/test-article/favorite`, () =>
        HttpResponse.json({ article: makeArticle(false) })
      )
    );
    const onToggle = vi.fn();
    wrap(makeArticle(true), onToggle);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(onToggle).toHaveBeenCalledWith(false));
  });
});
