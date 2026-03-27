import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { useAuth } from '../store/auth';
import Profile from './Profile';

vi.mock('../store/auth', () => ({ useAuth: vi.fn() }));

const API = 'https://api.realworld.show/api';

const mockProfile = { username: 'janedoe', bio: 'Jane bio', image: null, following: false };

const wrapProfile = (username = 'janedoe', path?: string) =>
  render(
    <MemoryRouter initialEntries={[path ?? `/profile/${username}`]}>
      <Routes>
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/profile/:username/favorites" element={<Profile />} />
      </Routes>
    </MemoryRouter>
  );

describe('Profile — viewing another user', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'unauthenticated', currentUser: null, setAuth: vi.fn(), purgeAuth: vi.fn() });
    server.use(
      http.get(`${API}/profiles/janedoe`, () => HttpResponse.json({ profile: mockProfile })),
      http.get(`${API}/articles`, () => HttpResponse.json({ articles: [], articlesCount: 0 }))
    );
  });

  it('shows the profile username', async () => {
    wrapProfile('janedoe');
    await waitFor(() => expect(screen.getByText('janedoe')).toBeInTheDocument());
  });

  it('shows the profile bio', async () => {
    wrapProfile('janedoe');
    await waitFor(() => expect(screen.getByText('Jane bio')).toBeInTheDocument());
  });

  it('shows the FollowButton for another user', async () => {
    wrapProfile('janedoe');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Follow janedoe/i })).toBeInTheDocument()
    );
  });

  it('shows My Posts and Favorited Posts tabs', async () => {
    wrapProfile('janedoe');
    await waitFor(() => expect(screen.getByText('My Posts')).toBeInTheDocument());
    expect(screen.getByText('Favorited Posts')).toBeInTheDocument();
  });
});

describe('Profile — viewing own profile', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      authState: 'authenticated',
      currentUser: { username: 'janedoe', email: 'j@x.com', token: 'tok', bio: null, image: null },
      setAuth: vi.fn(),
      purgeAuth: vi.fn(),
    });
    server.use(
      http.get(`${API}/profiles/janedoe`, () => HttpResponse.json({ profile: mockProfile })),
      http.get(`${API}/articles`, () => HttpResponse.json({ articles: [], articlesCount: 0 }))
    );
  });

  it('shows "Edit Profile Settings" link instead of FollowButton', async () => {
    wrapProfile('janedoe');
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /Edit Profile Settings/i })).toBeInTheDocument()
    );
    expect(screen.queryByRole('button', { name: /Follow/i })).not.toBeInTheDocument();
  });
});

describe('Profile — loading state', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'unauthenticated', currentUser: null, setAuth: vi.fn(), purgeAuth: vi.fn() });
    server.use(
      http.get(`${API}/profiles/janedoe`, () => HttpResponse.json({ profile: mockProfile })),
      http.get(`${API}/articles`, () => HttpResponse.json({ articles: [], articlesCount: 0 }))
    );
  });

  it('shows Loading... before the profile loads', () => {
    wrapProfile('janedoe');
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
