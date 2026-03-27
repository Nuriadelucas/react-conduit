import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { useAuth } from '../store/auth';
import ArticlePage from './Article';

vi.mock('../store/auth', () => ({ useAuth: vi.fn() }));

const API = 'https://api.realworld.show/api';

const mockAuthor = { username: 'author', bio: null, image: null, following: false };
const mockArticle = {
  slug: 'test-slug',
  title: 'Test Article',
  description: 'Desc',
  body: '# Hello World',
  tagList: ['tag1'],
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
  favorited: false,
  favoritesCount: 0,
  author: mockAuthor,
};
const mockComment = {
  id: 1,
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
  body: 'Great article!',
  author: { username: 'commenter', bio: null, image: null, following: false },
};

const wrapArticle = (slug = 'test-slug') =>
  render(
    <MemoryRouter initialEntries={[`/article/${slug}`]}>
      <Routes>
        <Route path="/article/:slug" element={<ArticlePage />} />
      </Routes>
    </MemoryRouter>
  );

describe('Article — loading', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'unauthenticated', currentUser: null, setAuth: vi.fn(), purgeAuth: vi.fn() });
    server.use(
      http.get(`${API}/articles/test-slug`, () => HttpResponse.json({ article: mockArticle })),
      http.get(`${API}/articles/test-slug/comments`, () => HttpResponse.json({ comments: [] }))
    );
  });

  it('shows Loading... before the article loads', () => {
    wrapArticle();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

describe('Article — loaded (unauthenticated)', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'unauthenticated', currentUser: null, setAuth: vi.fn(), purgeAuth: vi.fn() });
    server.use(
      http.get(`${API}/articles/test-slug`, () => HttpResponse.json({ article: mockArticle })),
      http.get(`${API}/articles/test-slug/comments`, () => HttpResponse.json({ comments: [mockComment] }))
    );
  });

  it('renders the article title', async () => {
    wrapArticle();
    await waitFor(() => expect(screen.getByText('Test Article')).toBeInTheDocument());
  });

  it('renders the comment', async () => {
    wrapArticle();
    await waitFor(() => expect(screen.getByText('Great article!')).toBeInTheDocument());
  });

  it('shows sign-in prompt instead of comment form', async () => {
    wrapArticle();
    await waitFor(() => expect(screen.getByText(/Sign in/)).toBeInTheDocument());
    expect(screen.queryByPlaceholderText('Write a comment...')).not.toBeInTheDocument();
  });

  it('shows the FollowButton (not the author)', async () => {
    wrapArticle();
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /Follow author/i }).length).toBeGreaterThan(0)
    );
  });
});

describe('Article — loaded (authenticated as author)', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      authState: 'authenticated',
      currentUser: { username: 'author', email: 'a@x.com', token: 'tok', bio: null, image: null },
      setAuth: vi.fn(),
      purgeAuth: vi.fn(),
    });
    server.use(
      http.get(`${API}/articles/test-slug`, () => HttpResponse.json({ article: mockArticle })),
      http.get(`${API}/articles/test-slug/comments`, () => HttpResponse.json({ comments: [] }))
    );
  });

  it('shows Edit Article and Delete Article buttons for the author', async () => {
    wrapArticle();
    await waitFor(() => expect(screen.getAllByText(/Edit Article/i).length).toBeGreaterThan(0));
    expect(screen.getAllByRole('button', { name: /Delete Article/i }).length).toBeGreaterThan(0);
  });

  it('shows the comment form for authenticated users', async () => {
    wrapArticle();
    await waitFor(() =>
      expect(screen.getByPlaceholderText('Write a comment...')).toBeInTheDocument()
    );
  });
});

describe('Article — comment submission', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      authState: 'authenticated',
      currentUser: { username: 'commenter', email: 'c@x.com', token: 'tok', bio: null, image: null },
      setAuth: vi.fn(),
      purgeAuth: vi.fn(),
    });
    server.use(
      http.get(`${API}/articles/test-slug`, () => HttpResponse.json({ article: mockArticle })),
      http.get(`${API}/articles/test-slug/comments`, () => HttpResponse.json({ comments: [] }))
    );
  });

  it('adds a new comment after submission', async () => {
    const newComment = { ...mockComment, id: 2, body: 'New comment', author: { username: 'commenter', bio: null, image: null, following: false } };
    server.use(
      http.post(`${API}/articles/test-slug/comments`, () =>
        HttpResponse.json({ comment: newComment })
      )
    );
    wrapArticle();
    await waitFor(() => expect(screen.getByPlaceholderText('Write a comment...')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Write a comment...'), { target: { value: 'New comment' } });
    fireEvent.submit(screen.getByRole('button', { name: /Post Comment/i }).closest('form')!);
    await waitFor(() => expect(screen.getByText('New comment')).toBeInTheDocument());
  });
});
