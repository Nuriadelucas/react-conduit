# Architecture Overview

## What This Application Does

**Conduit** is a blogging platform (think Medium), built as the React implementation of the [RealWorld](https://realworld-apps.github.io) demo spec. Users can:

- Browse a global feed of articles and filter by tags
- Register / log in and get a personalized "following" feed
- Write, edit, and delete their own articles (with Markdown support)
- Favorite articles and follow other authors
- Comment on articles
- Edit their profile (bio, avatar, email, password)

The app is a **Single Page Application (SPA)** — it loads once, then navigates between pages without full browser reloads.

---

## Project Structure

```
react-conduit/
├── index.html              # Root HTML shell — loads CDN fonts + icons
├── src/
│   ├── main.tsx            # Entry point — mounts <App />
│   ├── index.css           # Global Conduit CSS (RealWorld theme)
│   ├── App.tsx             # Root: AuthProvider + BrowserRouter + routes
│   │
│   ├── types/
│   │   └── index.ts        # All TypeScript interfaces and types
│   │
│   ├── lib/                # Pure utilities (no React)
│   │   ├── api.ts          # Axios instance with interceptors
│   │   ├── jwt.ts          # localStorage token helpers
│   │   ├── defaultImage.ts # Fallback avatar helper
│   │   └── markdown.ts     # marked + DOMPurify renderer
│   │
│   ├── store/
│   │   └── auth.tsx        # AuthProvider context + useAuth hook
│   │
│   ├── services/           # API call functions (thin wrappers over axios)
│   │   ├── articles.ts
│   │   ├── comments.ts
│   │   ├── profile.ts
│   │   ├── tags.ts
│   │   └── user.ts
│   │
│   ├── components/         # Reusable UI components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ListErrors.tsx
│   │   ├── ArticleList.tsx
│   │   ├── ArticlePreview.tsx
│   │   ├── ArticleMeta.tsx
│   │   ├── ArticleComment.tsx
│   │   ├── FavoriteButton.tsx
│   │   └── FollowButton.tsx
│   │
│   └── pages/              # Page-level components (lazy-loaded)
│       ├── Home.tsx
│       ├── Auth.tsx
│       ├── Article.tsx
│       ├── Editor.tsx
│       ├── Profile.tsx
│       └── Settings.tsx
│
└── public/
    └── assets/
        ├── conduit-logo.svg
        └── default-avatar.svg
```

---

## Key Patterns

### Auth State

`AuthProvider` (`src/store/auth.tsx`) manages a 4-state auth machine exposed via React Context:

```
loading  →  authenticated    (stored JWT validated via GET /user)
         →  unauthenticated  (no token, or 4xx response)
         →  unavailable      (5xx — server unreachable)
```

On mount, `AuthProvider` reads the JWT from `localStorage`. If one exists it calls `GET /user` to validate it before rendering the app. All pages render only after the auth state is settled (not `loading`).

### Route Guards

Two layout-route components in `App.tsx` use React Router's `<Outlet />` pattern:

- **`RequireAuth`** — redirects to `/login` if `unauthenticated`; shows a loading indicator while `loading`
- **`RequireGuest`** — redirects to `/` if `authenticated`; allows through otherwise

```
<Route element={<RequireAuth />}>
  <Route path="/settings" element={<Settings />} />
  <Route path="/editor" element={<Editor />} />
</Route>
```

### Lazy Loading

All six page components are loaded with `React.lazy` + `<Suspense>`, so their bundles are only downloaded when first navigated to:

```tsx
const Home = lazy(() => import('./pages/Home'));
```

### Routing Structure

| URL | Component | Auth |
|---|---|---|
| `/` | `Home` | No |
| `/tag/:tag` | `Home` | No |
| `/login` | `Auth` | Guest only |
| `/register` | `Auth` | Guest only |
| `/settings` | `Settings` | Required |
| `/editor` | `Editor` | Required |
| `/editor/:slug` | `Editor` | Required |
| `/article/:slug` | `Article` | No |
| `/profile/:username` | `Profile` | No |
| `/profile/:username/favorites` | `Profile` | No |
| `*` | — | Redirects to `/` |

### Data Flow

```
User action (click, form submit)
    │
    ▼
Component event handler
    │
    ▼
Service function called (src/services/)
    │
    ▼
Axios interceptors run automatically:
  1. Request interceptor  → adds "Authorization: Token <jwt>"
  2. Response interceptor → handles 401, normalizes errors
    │
    ▼
RealWorld API responds (https://api.realworld.show/api)
    │
    ▼
Service returns Promise<AxiosResponse>
    │
    ▼
Component updates local state (useState)
    │
    ▼
React re-renders affected parts of the UI
```

---

## API Integration

All HTTP traffic goes to:

```
https://api.realworld.show/api
```

This is a shared public test backend used by all RealWorld demo apps. The base URL is hardcoded in `src/lib/api.ts`.

### Authentication

- After login/register the backend returns a **JWT token**
- The token is stored in `localStorage` (key: `jwtToken`) via `src/lib/jwt.ts`
- Every subsequent request automatically includes: `Authorization: Token <jwt>`
- On 401 responses (except `GET /user`), the token is destroyed and the user is redirected to `/login`

### Key API Endpoints

| What | Endpoint |
|---|---|
| Login | `POST /users/login` |
| Register | `POST /users` |
| Get own profile | `GET /user` |
| Update settings | `PUT /user` |
| List articles | `GET /articles` |
| Personal feed | `GET /articles/feed` |
| Single article | `GET /articles/:slug` |
| Create article | `POST /articles` |
| Update article | `PUT /articles/:slug` |
| Delete article | `DELETE /articles/:slug` |
| Favorite article | `POST /articles/:slug/favorite` |
| Comments | `GET/POST/DELETE /articles/:slug/comments` |
| User profile | `GET /profiles/:username` |
| Follow/unfollow | `POST/DELETE /profiles/:username/follow` |
| Tags | `GET /tags` |

---

## Technical Notes

- **React 18** with functional components and hooks throughout — no class components
- **TypeScript strict mode** + `verbatimModuleSyntax` (all type-only imports use `import type`) + `erasableSyntaxOnly` (no TypeScript enums — use `as const` objects instead)
- **React Router v6** with nested layout routes for auth guards
- **`configKey` string pattern** in `ArticleList` to avoid object identity issues as `useEffect` dependencies
- **`ScrollToTop`** component resets scroll position on every route change
- Markdown is rendered client-side using `marked` + `DOMPurify` for XSS sanitization
- No state management library — all state is local `useState` or React Context for auth
