import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { useAuth } from '../store/auth';
import Auth from './Auth';

vi.mock('../store/auth', () => ({ useAuth: vi.fn() }));

const API = 'https://api.realworld.show/api';
const mockUser = { username: 'janedoe', email: 'janedoe@example.com', token: 'tok', bio: null, image: null };

const wrap = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Auth />
    </MemoryRouter>
  );

describe('Auth — login page (/login)', () => {
  let setAuth: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setAuth = vi.fn();
    vi.mocked(useAuth).mockReturnValue({ authState: 'unauthenticated', currentUser: null, setAuth, purgeAuth: vi.fn() });
  });

  it('shows "Sign in" heading', () => {
    wrap('/login');
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  it('does not show the username field', () => {
    wrap('/login');
    expect(screen.queryByPlaceholderText('Username')).not.toBeInTheDocument();
  });

  it('shows email and password fields', () => {
    wrap('/login');
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('submit button is disabled when form is empty', () => {
    wrap('/login');
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
  });

  it('calls setAuth with the user on successful login', async () => {
    server.use(
      http.post(`${API}/users/login`, () => HttpResponse.json({ user: mockUser }))
    );
    wrap('/login');
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'janedoe@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form')!);
    await waitFor(() => expect(setAuth).toHaveBeenCalledWith(mockUser));
  });

  it('shows errors on failed login', async () => {
    server.use(
      http.post(`${API}/users/login`, () =>
        HttpResponse.json({ errors: { 'email or password': ['is invalid'] } }, { status: 422 })
      )
    );
    wrap('/login');
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'bad@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrong' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form')!);
    await waitFor(() =>
      expect(screen.getByText(/email or password is invalid/i)).toBeInTheDocument()
    );
  });
});

describe('Auth — register page (/register)', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'unauthenticated', currentUser: null, setAuth: vi.fn(), purgeAuth: vi.fn() });
  });

  it('shows "Sign up" heading', () => {
    wrap('/register');
    expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
  });

  it('shows the username field', () => {
    wrap('/register');
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
  });

  it('submit button is disabled when form is empty', () => {
    wrap('/register');
    expect(screen.getByRole('button', { name: /sign up/i })).toBeDisabled();
  });
});
