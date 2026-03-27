import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { useAuth } from '../store/auth';
import { FollowButton } from './FollowButton';
import type { Profile } from '../types';

vi.mock('../store/auth', () => ({ useAuth: vi.fn() }));

const API = 'https://api.realworld.show/api';

const unfollowed: Profile = { username: 'janedoe', bio: null, image: null, following: false };
const followed: Profile = { username: 'janedoe', bio: null, image: null, following: true };

const wrap = (profile: Profile, onToggle = vi.fn()) =>
  render(
    <MemoryRouter>
      <FollowButton profile={profile} onToggle={onToggle} />
    </MemoryRouter>
  );

describe('FollowButton — not following', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'authenticated', currentUser: null, setAuth: vi.fn(), purgeAuth: vi.fn() });
  });

  it('shows "Follow janedoe"', () => {
    wrap(unfollowed);
    expect(screen.getByRole('button')).toHaveTextContent('Follow janedoe');
  });

  it('shows btn-outline-secondary class', () => {
    wrap(unfollowed);
    expect(screen.getByRole('button')).toHaveClass('btn-outline-secondary');
  });
});

describe('FollowButton — following', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'authenticated', currentUser: null, setAuth: vi.fn(), purgeAuth: vi.fn() });
  });

  it('shows "Unfollow janedoe"', () => {
    wrap(followed);
    expect(screen.getByRole('button')).toHaveTextContent('Unfollow janedoe');
  });

  it('shows btn-secondary class', () => {
    wrap(followed);
    expect(screen.getByRole('button')).toHaveClass('btn-secondary');
  });
});

describe('FollowButton — unauthenticated', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'unauthenticated', currentUser: null, setAuth: vi.fn(), purgeAuth: vi.fn() });
  });

  it('does not call onToggle when clicked (navigates to /login instead)', () => {
    const onToggle = vi.fn();
    wrap(unfollowed, onToggle);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).not.toHaveBeenCalled();
  });
});

describe('FollowButton — authenticated toggle', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'authenticated', currentUser: null, setAuth: vi.fn(), purgeAuth: vi.fn() });
  });

  it('calls onToggle with updated profile after following', async () => {
    server.use(
      http.post(`${API}/profiles/janedoe/follow`, () =>
        HttpResponse.json({ profile: followed })
      )
    );
    const onToggle = vi.fn();
    wrap(unfollowed, onToggle);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(onToggle).toHaveBeenCalledWith(followed));
  });

  it('calls onToggle with updated profile after unfollowing', async () => {
    server.use(
      http.delete(`${API}/profiles/janedoe/follow`, () =>
        HttpResponse.json({ profile: unfollowed })
      )
    );
    const onToggle = vi.fn();
    wrap(followed, onToggle);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(onToggle).toHaveBeenCalledWith(unfollowed));
  });
});
