import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ArticleMeta } from './ArticleMeta';
import type { Article } from '../types';

const mockArticle: Article = {
  slug: 'test',
  title: 'Title',
  description: 'Desc',
  body: 'Body',
  tagList: [],
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
  favorited: false,
  favoritesCount: 0,
  author: { username: 'janedoe', bio: null, image: null, following: false },
};

const wrap = (children?: React.ReactNode) =>
  render(
    <MemoryRouter>
      <ArticleMeta article={mockArticle}>{children}</ArticleMeta>
    </MemoryRouter>
  );

describe('ArticleMeta', () => {
  it('renders the author username', () => {
    wrap();
    expect(screen.getAllByText('janedoe').length).toBeGreaterThan(0);
  });

  it('links to the author profile', () => {
    wrap();
    const links = screen.getAllByRole('link', { name: /janedoe/i });
    expect(links[0]).toHaveAttribute('href', '/profile/janedoe');
  });

  it('renders the formatted date', () => {
    wrap();
    expect(screen.getByText('January 15, 2024')).toBeInTheDocument();
  });

  it('renders children in the slot', () => {
    wrap(<span>Action button</span>);
    expect(screen.getByText('Action button')).toBeInTheDocument();
  });
});
