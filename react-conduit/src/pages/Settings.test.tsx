import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../store/auth';
import Settings from './Settings';

vi.mock('../store/auth', () => ({ useAuth: vi.fn() }));

const mockUser = { username: 'janedoe', email: 'janedoe@example.com', token: 'tok', bio: 'My bio', image: 'https://example.com/img.png' };

const wrap = () =>
  render(
    <MemoryRouter>
      <Settings />
    </MemoryRouter>
  );

describe('Settings', () => {
  it('shows the Your Settings heading', () => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'authenticated', currentUser: null, setAuth: vi.fn(), purgeAuth: vi.fn() });
    wrap();
    expect(screen.getByRole('heading', { name: /Your Settings/i })).toBeInTheDocument();
  });

  it('pre-fills the form with current user data', () => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'authenticated', currentUser: mockUser, setAuth: vi.fn(), purgeAuth: vi.fn() });
    wrap();
    expect(screen.getByDisplayValue('janedoe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('janedoe@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('My bio')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://example.com/img.png')).toBeInTheDocument();
  });

  it('shows the logout button', () => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'authenticated', currentUser: mockUser, setAuth: vi.fn(), purgeAuth: vi.fn() });
    wrap();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('calls purgeAuth on logout', () => {
    const purgeAuth = vi.fn();
    vi.mocked(useAuth).mockReturnValue({ authState: 'authenticated', currentUser: mockUser, setAuth: vi.fn(), purgeAuth });
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(purgeAuth).toHaveBeenCalledOnce();
  });

  it('shows the Update Settings submit button', () => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'authenticated', currentUser: mockUser, setAuth: vi.fn(), purgeAuth: vi.fn() });
    wrap();
    expect(screen.getByRole('button', { name: /Update Settings/i })).toBeInTheDocument();
  });
});
