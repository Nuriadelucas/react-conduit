import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { ArticleComment } from './ArticleComment';
import type { Comment } from '../types';

vi.mock('../store/auth', () => ({ useAuth: vi.fn() }));

const makeComment = (authorUsername = 'janedoe'): Comment => ({
  id: 1,
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
  body: 'Great article!',
  author: { username: authorUsername, bio: null, image: null, following: false },
});

const wrap = (comment: Comment, onDelete = vi.fn()) =>
  render(
    <MemoryRouter>
      <ArticleComment comment={comment} onDelete={onDelete} />
    </MemoryRouter>
  );

describe('ArticleComment — unauthenticated', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'unauthenticated', currentUser: null, setAuth: vi.fn(), purgeAuth: vi.fn() });
  });

  it('renders the comment body', () => {
    wrap(makeComment());
    expect(screen.getByText('Great article!')).toBeInTheDocument();
  });

  it('renders the author username', () => {
    wrap(makeComment());
    expect(screen.getAllByText('janedoe').length).toBeGreaterThan(0);
  });

  it('does not show the delete icon when not logged in', () => {
    wrap(makeComment());
    expect(document.querySelector('.ion-trash-a')).not.toBeInTheDocument();
  });
});

describe('ArticleComment — different user', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      authState: 'authenticated',
      currentUser: { username: 'otheruser', email: 'o@x.com', token: 'tok', bio: null, image: null },
      setAuth: vi.fn(),
      purgeAuth: vi.fn(),
    });
  });

  it('does not show the delete icon for a different user', () => {
    wrap(makeComment('janedoe'));
    expect(document.querySelector('.ion-trash-a')).not.toBeInTheDocument();
  });
});

describe('ArticleComment — comment author', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      authState: 'authenticated',
      currentUser: { username: 'janedoe', email: 'j@x.com', token: 'tok', bio: null, image: null },
      setAuth: vi.fn(),
      purgeAuth: vi.fn(),
    });
  });

  it('shows the delete icon for the comment author', () => {
    wrap(makeComment('janedoe'));
    expect(document.querySelector('.ion-trash-a')).toBeInTheDocument();
  });

  it('calls onDelete when the delete icon is clicked', () => {
    const onDelete = vi.fn();
    wrap(makeComment('janedoe'), onDelete);
    fireEvent.click(document.querySelector('.ion-trash-a')!);
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
