import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { useAuth } from '../store/auth';
import Editor from './Editor';

vi.mock('../store/auth', () => ({ useAuth: vi.fn() }));

const API = 'https://api.realworld.show/api';
const mockUser = { username: 'janedoe', email: 'j@example.com', token: 'tok', bio: null, image: null };

const mockArticle = {
  slug: 'my-draft',
  title: 'My Draft',
  description: 'Draft description',
  body: 'Draft body',
  tagList: ['draft', 'wip'],
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
  favorited: false,
  favoritesCount: 0,
  author: { username: 'janedoe', bio: null, image: null, following: false },
};

// Create mode: render without a slug route
const wrapCreate = () =>
  render(
    <MemoryRouter initialEntries={['/editor']}>
      <Routes>
        <Route path="/editor" element={<Editor />} />
      </Routes>
    </MemoryRouter>
  );

// Edit mode: render with slug param
const wrapEdit = (slug: string) =>
  render(
    <MemoryRouter initialEntries={[`/editor/${slug}`]}>
      <Routes>
        <Route path="/editor/:slug" element={<Editor />} />
      </Routes>
    </MemoryRouter>
  );

describe('Editor — create mode', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'authenticated', currentUser: mockUser, setAuth: vi.fn(), purgeAuth: vi.fn() });
  });

  it('renders an empty form', () => {
    wrapCreate();
    expect(screen.getByPlaceholderText('Article Title')).toHaveValue('');
    expect(screen.getByPlaceholderText("What's this article about?")).toHaveValue('');
  });

  it('shows the Publish Article button', () => {
    wrapCreate();
    expect(screen.getByRole('button', { name: /Publish Article/i })).toBeInTheDocument();
  });

  it('adds a tag when Enter is pressed in the tag input', () => {
    wrapCreate();
    const tagInput = screen.getByPlaceholderText('Enter tags');
    fireEvent.change(tagInput, { target: { value: 'react' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    expect(screen.getByText('react')).toBeInTheDocument();
  });

  it('does not add duplicate tags', () => {
    wrapCreate();
    const tagInput = screen.getByPlaceholderText('Enter tags');
    fireEvent.change(tagInput, { target: { value: 'react' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    fireEvent.change(tagInput, { target: { value: 'react' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    expect(screen.getAllByText('react')).toHaveLength(1);
  });

  it('removes a tag when the X icon is clicked', () => {
    wrapCreate();
    const tagInput = screen.getByPlaceholderText('Enter tags');
    fireEvent.change(tagInput, { target: { value: 'angular' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    expect(screen.getByText('angular')).toBeInTheDocument();
    fireEvent.click(document.querySelector('.ion-close-round')!);
    expect(screen.queryByText('angular')).not.toBeInTheDocument();
  });

  it('calls createArticle on form submit', async () => {
    let capturedBody: unknown;
    server.use(
      http.post(`${API}/articles`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ article: { ...mockArticle, slug: 'new-article' } });
      })
    );
    wrapCreate();
    fireEvent.change(screen.getByPlaceholderText('Article Title'), { target: { value: 'New Article' } });
    fireEvent.change(screen.getByPlaceholderText("What's this article about?"), { target: { value: 'About' } });
    fireEvent.change(screen.getByPlaceholderText('Write your article (in markdown)'), { target: { value: 'Content' } });
    fireEvent.submit(screen.getByRole('button', { name: /Publish Article/i }).closest('form')!);
    await waitFor(() => expect(capturedBody).toBeTruthy());
  });
});

describe('Editor — edit mode', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ authState: 'authenticated', currentUser: mockUser, setAuth: vi.fn(), purgeAuth: vi.fn() });
    server.use(
      http.get(`${API}/articles/my-draft`, () => HttpResponse.json({ article: mockArticle }))
    );
  });

  it('pre-fills the form with the existing article data', async () => {
    wrapEdit('my-draft');
    await waitFor(() => expect(screen.getByDisplayValue('My Draft')).toBeInTheDocument());
    expect(screen.getByDisplayValue('Draft description')).toBeInTheDocument();
  });

  it('renders existing tags', async () => {
    wrapEdit('my-draft');
    await waitFor(() => expect(screen.getByText('draft')).toBeInTheDocument());
    expect(screen.getByText('wip')).toBeInTheDocument();
  });
});
