import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { Header } from './Header';

vi.mock('../store/auth', () => ({ useAuth: vi.fn() }));

const mockUser = { username: 'janedoe', email: 'j@example.com', token: 'tok', bio: null, image: null };

const wrap = () => render(<MemoryRouter><Header /></MemoryRouter>);

describe('Header — loading', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'loading', currentUser: null, setAuth: vi.fn(), purgeAuth: vi.fn() });
  });

  it('shows Loading...', () => {
    wrap();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

describe('Header — unauthenticated', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'unauthenticated', currentUser: null, setAuth: vi.fn(), purgeAuth: vi.fn() });
  });

  it('shows Sign in and Sign up links', () => {
    wrap();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });

  it('does not show New Article', () => {
    wrap();
    expect(screen.queryByText(/New Article/)).not.toBeInTheDocument();
  });
});

describe('Header — authenticated', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'authenticated', currentUser: mockUser, setAuth: vi.fn(), purgeAuth: vi.fn() });
  });

  it('shows New Article and Settings links', () => {
    wrap();
    expect(screen.getByText(/New Article/)).toBeInTheDocument();
    expect(screen.getByText(/Settings/)).toBeInTheDocument();
  });

  it('shows the username', () => {
    wrap();
    expect(screen.getByText('janedoe')).toBeInTheDocument();
  });

  it('does not show Sign in', () => {
    wrap();
    expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument();
  });
});

describe('Header — unavailable', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'unavailable', currentUser: null, setAuth: vi.fn(), purgeAuth: vi.fn() });
  });

  it('shows Connecting...', () => {
    wrap();
    expect(screen.getByText(/Connecting/)).toBeInTheDocument();
  });

  it('shows New Article link', () => {
    wrap();
    expect(screen.getByText(/New Article/)).toBeInTheDocument();
  });
});
