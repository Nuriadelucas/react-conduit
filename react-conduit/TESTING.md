# Testing Guide

No test suite is wired up yet. This document describes the recommended setup and provides examples for testing each layer of the app.

---

## Recommended Stack

| Layer | Tool | Purpose |
|---|---|---|
| Unit + integration tests | [Vitest](https://vitest.dev) | Fast, Vite-native test runner — no extra config needed |
| Component testing | [React Testing Library](https://testing-library.com/react) | Renders components and queries the DOM |
| HTTP mocking | [MSW](https://mswjs.io) (Mock Service Worker) | Intercepts `axios` requests at the network level |
| E2E tests | [Playwright](https://playwright.dev) | Full user flows in a real browser |

---

## Setup

### 1. Install dependencies

```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom msw @playwright/test
```

### 2. Add test scripts to `package.json`

```json
{
  "scripts": {
    "test":          "vitest",
    "test:ui":       "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e":      "playwright test",
    "test:e2e:ui":   "playwright test --ui"
  }
}
```

### 3. Configure Vitest in `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### 4. Create `src/test-setup.ts`

```ts
import '@testing-library/jest-dom';
```

### 5. Create `playwright.config.ts`

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Test File Locations

```
src/
├── lib/
│   ├── jwt.test.ts             # JWT helper tests
│   ├── defaultImage.test.ts    # defaultImage helper tests
│   └── markdown.test.ts        # parseMarkdown tests
├── services/
│   ├── articles.test.ts
│   ├── comments.test.ts
│   ├── profile.test.ts
│   ├── tags.test.ts
│   └── user.test.ts
├── store/
│   └── auth.test.tsx           # AuthProvider + useAuth hook tests
└── components/
    ├── ListErrors.test.tsx
    ├── ArticleList.test.tsx
    ├── FavoriteButton.test.tsx
    └── FollowButton.test.tsx

e2e/
├── auth.spec.ts
├── articles.spec.ts
├── comments.spec.ts
├── settings.spec.ts
├── navigation.spec.ts
├── social.spec.ts
└── xss-security.spec.ts
```

---

## Unit Tests

### Testing utility functions (`src/lib/`)

Pure functions — no mocking needed.

```ts
// src/lib/jwt.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { getToken, saveToken, destroyToken } from './jwt';

describe('JWT helpers', () => {
  beforeEach(() => localStorage.clear());

  it('returns null when no token is stored', () => {
    expect(getToken()).toBeNull();
  });

  it('saves and retrieves a token', () => {
    saveToken('my-token');
    expect(getToken()).toBe('my-token');
  });

  it('destroyToken removes the token', () => {
    saveToken('my-token');
    destroyToken();
    expect(getToken()).toBeNull();
  });
});
```

```ts
// src/lib/defaultImage.test.ts
import { describe, it, expect } from 'vitest';
import { defaultImage } from './defaultImage';

describe('defaultImage', () => {
  it('returns the image URL when provided', () => {
    expect(defaultImage('https://example.com/avatar.jpg')).toBe('https://example.com/avatar.jpg');
  });

  it('returns the fallback for null', () => {
    expect(defaultImage(null)).toBe('/assets/default-avatar.svg');
  });

  it('returns the fallback for undefined', () => {
    expect(defaultImage(undefined)).toBe('/assets/default-avatar.svg');
  });

  it('returns the fallback for empty string', () => {
    expect(defaultImage('')).toBe('/assets/default-avatar.svg');
  });
});
```

---

### Testing services (`src/services/`)

Use MSW to intercept HTTP requests at the network level. This tests the full Axios pipeline including interceptors.

#### MSW setup

Create `src/mocks/server.ts`:

```ts
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const server = setupServer();
```

Add to `src/test-setup.ts`:

```ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

#### Example service test

```ts
// src/services/articles.test.ts
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { getArticle, createArticle } from './articles';

const BASE = 'https://api.realworld.show/api';

const mockArticle = {
  slug: 'test-article',
  title: 'Test Article',
  description: 'A test',
  body: '# Hello',
  tagList: ['test'],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  favorited: false,
  favoritesCount: 0,
  author: { username: 'user', bio: null, image: null, following: false },
};

describe('getArticle', () => {
  it('fetches a single article by slug', async () => {
    server.use(
      http.get(`${BASE}/articles/test-article`, () =>
        HttpResponse.json({ article: mockArticle })
      )
    );
    const { data } = await getArticle('test-article');
    expect(data.article.slug).toBe('test-article');
    expect(data.article.title).toBe('Test Article');
  });
});

describe('createArticle', () => {
  it('posts to /articles and returns the new article', async () => {
    server.use(
      http.post(`${BASE}/articles`, () =>
        HttpResponse.json({ article: mockArticle })
      )
    );
    const { data } = await createArticle({ title: 'Test Article', body: '# Hello', description: 'A test', tagList: [] });
    expect(data.article.slug).toBe('test-article');
  });
});
```

---

### Testing the auth store (`src/store/auth.tsx`)

Use `renderHook` to test the `useAuth` hook in isolation.

```tsx
// src/store/auth.test.tsx
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { AuthProvider, useAuth } from './auth';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

const mockUser = {
  email: 'test@example.com',
  token: 'test-token',
  username: 'testuser',
  bio: null,
  image: null,
};

describe('useAuth', () => {
  it('starts in loading state', () => {
    server.use(
      http.get('https://api.realworld.show/api/user', () =>
        HttpResponse.json({ user: mockUser })
      )
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.authState).toBe('loading');
  });

  it('transitions to authenticated when token is valid', async () => {
    localStorage.setItem('jwtToken', 'valid-token');
    server.use(
      http.get('https://api.realworld.show/api/user', () =>
        HttpResponse.json({ user: mockUser })
      )
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    await vi.waitFor(() => {
      expect(result.current.authState).toBe('authenticated');
    });
    expect(result.current.currentUser?.username).toBe('testuser');
    localStorage.clear();
  });

  it('transitions to unauthenticated when no token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await vi.waitFor(() => {
      expect(result.current.authState).toBe('unauthenticated');
    });
  });

  it('purgeAuth clears the user and token', async () => {
    localStorage.setItem('jwtToken', 'valid-token');
    server.use(
      http.get('https://api.realworld.show/api/user', () =>
        HttpResponse.json({ user: mockUser })
      )
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    await vi.waitFor(() => expect(result.current.authState).toBe('authenticated'));
    act(() => result.current.purgeAuth());
    expect(result.current.authState).toBe('unauthenticated');
    expect(result.current.currentUser).toBeNull();
    expect(localStorage.getItem('jwtToken')).toBeNull();
    localStorage.clear();
  });
});
```

---

### Testing components (`src/components/`)

Use `render` + `screen` from React Testing Library.

```tsx
// src/components/ListErrors.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ListErrors } from './ListErrors';

describe('ListErrors', () => {
  it('renders nothing when errors is null', () => {
    const { container } = render(<ListErrors errors={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders one <li> per message', () => {
    render(<ListErrors errors={{ errors: { email: ['is invalid', 'is taken'] } }} />);
    expect(screen.getByText('email is invalid')).toBeInTheDocument();
    expect(screen.getByText('email is taken')).toBeInTheDocument();
  });

  it('renders messages from multiple fields', () => {
    render(<ListErrors errors={{ errors: { username: ['is taken'], password: ['is too short'] } }} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
```

---

## End-to-End Tests

E2E tests use Playwright and run against the live dev server (`http://localhost:5173`).

### Running

```bash
npm run test:e2e             # Run all tests headlessly
npm run test:e2e:ui          # Open the Playwright interactive UI
npx playwright test --headed # Run in a visible browser window
npx playwright test --debug  # Attach Playwright Inspector
npx playwright show-report   # Open the last HTML report
```

### Example tests

```ts
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('home page loads with article list', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.article-preview')).toHaveCount(10);
});

test('redirects to login when accessing /settings unauthenticated', async ({ page }) => {
  await page.goto('/settings');
  await expect(page).toHaveURL('/login');
});

test('register creates an account and redirects home', async ({ page }) => {
  await page.goto('/register');
  await page.fill('[name="username"]', `user${Date.now()}`);
  await page.fill('[name="email"]', `user${Date.now()}@example.com`);
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/');
});
```

```ts
// e2e/xss-security.spec.ts
import { test, expect } from '@playwright/test';

test('markdown body is sanitized — no script execution', async ({ page }) => {
  // Navigate to an article with a known XSS payload in the body
  // and assert no alert or script side-effect occurs
  let alertFired = false;
  page.on('dialog', () => { alertFired = true; });
  await page.goto('/article/xss-test-article');
  await page.waitForLoadState('networkidle');
  expect(alertFired).toBe(false);
});
```

---

## What Is and Is Not Tested

| Layer | Status | How |
|---|---|---|
| Utility functions (`lib/`) | Not yet | Unit tests with Vitest |
| Services (HTTP calls) | Not yet | Vitest + MSW |
| Auth store (`useAuth`) | Not yet | `renderHook` + MSW |
| UI components | Not yet | React Testing Library |
| Full user flows | Not yet | Playwright E2E |
| XSS / security | Not yet | Playwright E2E (`@security` tag) |
