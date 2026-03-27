import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import App from './App';

const API = 'https://api.realworld.show/api';

// App uses BrowserRouter internally; jsdom defaults to http://localhost/ → renders Home

describe('App', () => {
  beforeEach(() => {
    // No token in localStorage → AuthProvider immediately sets unauthenticated
    server.use(
      http.get(`${API}/articles`, () => HttpResponse.json({ articles: [], articlesCount: 0 })),
      http.get(`${API}/tags`, () => HttpResponse.json({ tags: [] }))
    );
  });

  it('renders the header with the Conduit logo', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole('img', { name: 'Conduit' })).toBeInTheDocument()
    );
  });

  it('renders the footer', async () => {
    render(<App />);
    // Both the header logo and footer have a "Conduit" link
    await waitFor(() => expect(screen.getAllByRole('link', { name: 'Conduit' }).length).toBeGreaterThanOrEqual(2));
  });

  it('renders the Home page at /', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('Global Feed')).toBeInTheDocument());
  });

  it('shows Sign in and Sign up for unauthenticated users', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });
});
