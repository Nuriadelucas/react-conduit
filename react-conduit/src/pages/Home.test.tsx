import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { useAuth } from '../store/auth';
import Home from './Home';

vi.mock('../store/auth', () => ({ useAuth: vi.fn() }));

const API = 'https://api.realworld.show/api';

function LocationDisplay() {
  const loc = useLocation();
  return <span data-testid="loc">{loc.pathname + loc.search}</span>;
}

const wrapHome = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tag/:tag" element={<Home />} />
        <Route path="/login" element={<span>Login page</span>} />
      </Routes>
      <LocationDisplay />
    </MemoryRouter>
  );

describe('Home — global feed (unauthenticated)', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'unauthenticated', currentUser: null, setAuth: vi.fn(), purgeAuth: vi.fn() });
    server.use(
      http.get(`${API}/articles`, () => HttpResponse.json({ articles: [], articlesCount: 0 })),
      http.get(`${API}/tags`, () => HttpResponse.json({ tags: ['angular', 'react'] }))
    );
  });

  it('renders the Home page', async () => {
    wrapHome();
    await waitFor(() => expect(screen.getByText('Global Feed')).toBeInTheDocument());
  });

  it('shows the banner for unauthenticated users', async () => {
    wrapHome();
    await waitFor(() => expect(document.querySelector('.banner')).toBeInTheDocument());
  });

  it('does not show "Your Feed" for unauthenticated users', async () => {
    wrapHome();
    await waitFor(() => expect(screen.queryByText('Your Feed')).not.toBeInTheDocument());
  });

  it('loads and renders tags', async () => {
    wrapHome();
    await waitFor(() => expect(screen.getByText('angular')).toBeInTheDocument());
    expect(screen.getByText('react')).toBeInTheDocument();
  });
});

describe('Home — authenticated', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      authState: 'authenticated',
      currentUser: { username: 'me', email: 'm@x.com', token: 'tok', bio: null, image: null },
      setAuth: vi.fn(),
      purgeAuth: vi.fn(),
    });
    server.use(
      http.get(`${API}/articles`, () => HttpResponse.json({ articles: [], articlesCount: 0 })),
      http.get(`${API}/tags`, () => HttpResponse.json({ tags: [] }))
    );
  });

  it('shows "Your Feed" link for authenticated users', async () => {
    wrapHome();
    await waitFor(() => expect(screen.getByText('Your Feed')).toBeInTheDocument());
  });

  it('does not show the banner for authenticated users', async () => {
    wrapHome();
    await waitFor(() => expect(document.querySelector('.banner')).not.toBeInTheDocument());
  });
});

describe('Home — following feed redirect when unauthenticated', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'unauthenticated', currentUser: null, setAuth: vi.fn(), purgeAuth: vi.fn() });
    server.use(
      http.get(`${API}/articles`, () => HttpResponse.json({ articles: [], articlesCount: 0 })),
      http.get(`${API}/articles/feed`, () => HttpResponse.json({ articles: [], articlesCount: 0 })),
      http.get(`${API}/tags`, () => HttpResponse.json({ tags: [] }))
    );
  });

  it('redirects to /login when unauthenticated user requests the following feed', async () => {
    wrapHome('/?feed=following');
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent('/login'));
  });
});
