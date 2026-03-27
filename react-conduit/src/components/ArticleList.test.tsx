import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { useAuth } from '../store/auth';
import { ArticleList } from './ArticleList';
import type { Article, ArticleListConfig } from '../types';

vi.mock('../store/auth', () => ({ useAuth: vi.fn() }));

const API = 'https://api.realworld.show/api';

const globalConfig: ArticleListConfig = { type: 'all', filters: {} };
const followingConfig: ArticleListConfig = { type: 'feed', filters: {} };

const mockArticle: Article = {
  slug: 'hello-world',
  title: 'Hello World',
  description: 'First post',
  body: 'Body',
  tagList: [],
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
  favorited: false,
  favoritesCount: 0,
  author: { username: 'janedoe', bio: null, image: null, following: false },
};

const wrap = (
  config: ArticleListConfig = globalConfig,
  { isFollowingFeed = false, currentPage = 1, onPageChange = vi.fn() } = {}
) =>
  render(
    <MemoryRouter>
      <ArticleList
        config={config}
        limit={10}
        currentPage={currentPage}
        isFollowingFeed={isFollowingFeed}
        onPageChange={onPageChange}
      />
    </MemoryRouter>
  );

describe('ArticleList', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'unauthenticated', currentUser: null, setAuth: vi.fn(), purgeAuth: vi.fn() });
  });

  it('shows "Loading articles..." initially', () => {
    server.use(http.get(`${API}/articles`, () => HttpResponse.json({ articles: [], articlesCount: 0 })));
    wrap();
    expect(screen.getByText('Loading articles...')).toBeInTheDocument();
  });

  it('shows "No articles are here... yet." for an empty global feed', async () => {
    server.use(http.get(`${API}/articles`, () => HttpResponse.json({ articles: [], articlesCount: 0 })));
    wrap(globalConfig);
    await waitFor(() => expect(screen.getByText('No articles are here... yet.')).toBeInTheDocument());
  });

  it('shows the empty following feed message for an empty following feed', async () => {
    server.use(http.get(`${API}/articles/feed`, () => HttpResponse.json({ articles: [], articlesCount: 0 })));
    wrap(followingConfig, { isFollowingFeed: true });
    await waitFor(() => expect(screen.getByText(/Your feed is empty/)).toBeInTheDocument());
  });

  it('renders articles after loading', async () => {
    server.use(http.get(`${API}/articles`, () => HttpResponse.json({ articles: [mockArticle], articlesCount: 1 })));
    wrap();
    await waitFor(() => expect(screen.getByText('Hello World')).toBeInTheDocument());
  });

  it('renders pagination when there are multiple pages', async () => {
    const articles = Array.from({ length: 2 }, (_, i) => ({ ...mockArticle, slug: `slug-${i}`, title: `Article ${i}` }));
    server.use(http.get(`${API}/articles`, () => HttpResponse.json({ articles, articlesCount: 25 })));
    wrap(globalConfig, { currentPage: 1 });
    await waitFor(() => expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument());
  });

  it('calls onPageChange when a page button is clicked', async () => {
    const articles = Array.from({ length: 2 }, (_, i) => ({ ...mockArticle, slug: `p-${i}`, title: `P ${i}` }));
    server.use(http.get(`${API}/articles`, () => HttpResponse.json({ articles, articlesCount: 25 })));
    const onPageChange = vi.fn();
    wrap(globalConfig, { onPageChange });
    await waitFor(() => expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('shows error message on fetch failure', async () => {
    server.use(http.get(`${API}/articles`, () => HttpResponse.json({}, { status: 500 })));
    wrap();
    await waitFor(() => expect(screen.getByText('Error loading articles.')).toBeInTheDocument());
  });
});
