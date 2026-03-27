# Migration Plan

This document outlines a recommended approach for migrating the React Conduit app to another framework (e.g., Vue, Svelte, Solid, or similar).

> **Where this app came from:** This project is itself a migration from Angular Conduit. For the full retrospective — including an Angular → React concept mapping and the decisions made — see [MIGRATION_REPORT.md](MIGRATION_REPORT.md).

---

## Guiding Principle

Migrate from the **bottom up**: start with small, isolated pieces that have no dependencies on other app components (leaf nodes), then work toward the bigger page-level components that depend on everything else.

---

## Recommended Migration Order

### Phase 1 — Foundation (no framework dependencies)

These are pure TypeScript utilities with no React-specific code. They can be copied directly to the new project with no changes.

| # | Item | File | Notes |
|---|---|---|---|
| 1 | **Type definitions** | `src/types/index.ts` | All 6 interfaces (`User`, `Article`, `Comment`, `Profile`, `ArticleListConfig`, `Errors`) + `LoadingState` as const. Fully framework-agnostic. |
| 2 | **JWT helpers** | `src/lib/jwt.ts` | 3 plain functions over `localStorage`. Copy as-is. |
| 3 | **API base URL + interceptors** | `src/lib/api.ts` | Axios instance with request/response interceptors. Swap for the new framework's HTTP client or keep Axios — it works anywhere. |
| 4 | **Default image helper** | `src/lib/defaultImage.ts` | One-liner function. Copy as-is. |
| 5 | **Markdown renderer** | `src/lib/markdown.ts` | `marked` + `DOMPurify`. Both are framework-agnostic npm packages. Copy as-is. |

---

### Phase 2 — Service Layer (no UI)

Service modules are plain functions that return Promises. They import only from `src/lib/api.ts` and `src/types/index.ts` — no React imports anywhere.

| # | Service | File | Key functions |
|---|---|---|---|
| 6 | **Tags** | `src/services/tags.ts` | `getTags()` — one GET. Simplest. |
| 7 | **Comments** | `src/services/comments.ts` | `getComments`, `addComment`, `deleteComment` |
| 8 | **Profile** | `src/services/profile.ts` | `getProfile`, `followUser`, `unfollowUser` |
| 9 | **Articles** | `src/services/articles.ts` | `queryArticles`, `getArticle`, `createArticle`, `updateArticle`, `deleteArticle`, `favoriteArticle`, `unfavoriteArticle` |
| 10 | **User** | `src/services/user.ts` | `login`, `register`, `updateUser` |

---

### Phase 3 — Auth State

The `AuthProvider` in `src/store/auth.tsx` is the only stateful piece in the foundation. It manages the 4-state auth machine and exposes `currentUser`, `authState`, `setAuth`, and `purgeAuth`.

In the new framework, replace this with the equivalent global state mechanism:

| # | React | New framework equivalent |
|---|---|---|
| 11 | `AuthProvider` React Context | Pinia store (Vue), Svelte store, Solid signal, Zustand, etc. |
| | `useAuth()` hook | Composable (Vue) / store import / context equivalent |
| | `useState` + `useEffect` for init | `onMounted` / lifecycle equivalent |

The auth state machine logic itself (4 states, JWT validation on mount, `setAuth`/`purgeAuth`) is the same regardless of framework — only the reactivity primitives change.

---

### Phase 4 — Leaf UI Components (no child components)

These components have no child app-components — they only use HTML, the utility functions from Phase 1, and the auth state from Phase 3.

| # | Component | File | React-specific to replace |
|---|---|---|---|
| 12 | **`ListErrors`** | `src/components/ListErrors.tsx` | Props → equivalent input mechanism |
| 13 | **`Footer`** | `src/components/Footer.tsx` | `<Link>` → new framework's router link |
| 14 | **`ArticleMeta`** | `src/components/ArticleMeta.tsx` | `children` prop → slot / `<slot>` |
| 15 | **`ArticleComment`** | `src/components/ArticleComment.tsx` | `useAuth()` → auth store |

---

### Phase 5 — Action Button Components

Small interactive components that depend on services and auth state but no other components.

| # | Component | File | React-specific to replace |
|---|---|---|---|
| 16 | **`FavoriteButton`** | `src/components/FavoriteButton.tsx` | `children` prop → slot; `useNavigate` → router |
| 17 | **`FollowButton`** | `src/components/FollowButton.tsx` | `useNavigate` → router |

---

### Phase 6 — Compound Components

These compose the leaf components from Phase 4/5.

| # | Component | File | Notes |
|---|---|---|---|
| 18 | **`ArticlePreview`** | `src/components/ArticlePreview.tsx` | Local state for optimistic favorite count update |
| 19 | **`ArticleList`** | `src/components/ArticleList.tsx` | See `configKey` pattern below |

---

### Phase 7 — Page Components

Port these last since they depend on everything above.

| # | Page | File | Major dependencies |
|---|---|---|---|
| 20 | **`Auth`** | `src/pages/Auth.tsx` | User service, `ListErrors`, router |
| 21 | **`Settings`** | `src/pages/Settings.tsx` | User service, auth store, `ListErrors`, router |
| 22 | **`Editor`** | `src/pages/Editor.tsx` | Articles service, auth store, `ListErrors`, router params |
| 23 | **`Profile`** | `src/pages/Profile.tsx` | Profile service, `ArticleList`, `FollowButton`, router |
| 24 | **`Article`** | `src/pages/Article.tsx` | Articles + comments services, `ArticleMeta`, `FavoriteButton`, `FollowButton`, `ArticleComment`, markdown |
| 25 | **`Home`** | `src/pages/Home.tsx` | `ArticleList`, tags service, auth store, router params + query |

---

### Phase 8 — App Shell and Routing

| # | Item | React | New framework equivalent |
|---|---|---|---|
| 26 | **Route definitions** | `App.tsx` `<Routes>/<Route>` | Vue Router, SvelteKit routes, etc. |
| 27 | **Auth guard** | `RequireAuth` layout route (`<Outlet />`) | Navigation guard / middleware |
| 28 | **Guest guard** | `RequireGuest` layout route | Navigation guard / middleware |
| 29 | **Lazy loading** | `React.lazy` + `<Suspense>` | Dynamic imports / async routes |
| 30 | **Header** | `src/components/Header.tsx` | Port last — depends on auth store + router |
| 31 | **Scroll reset** | `ScrollToTop` component | Route change hook / navigation guard |
| 32 | **Root shell** | `AppLayout` in `App.tsx` | Root layout component |

---

## Potential Challenges

### 1. Auth State Initialization

The `AuthProvider` validates the stored JWT via `GET /user` before rendering the app. The `RequireAuth` guard waits for `authState !== 'loading'` before redirecting. Your new framework must preserve this timing — rendering a protected page before auth is resolved will cause a flash of unauthenticated content.

### 2. `ArticleList` — Config Object as Dependency

`ArticleList` accepts a `config: ArticleListConfig` object and re-fetches when it changes. React objects cause infinite re-renders if recreated on every render cycle; the solution here is a `configKey` string derived from the config's primitives:

```ts
const configKey = `${config.type}:${config.filters.tag ?? ''}:${config.filters.author ?? ''}:${config.filters.favorited ?? ''}`;
```

Your new framework may handle object-identity differently (Vue's `watchEffect`, Svelte's reactive declarations, etc.), but watch out for the same class of problem.

### 3. `children` Prop / Content Projection

`ArticleMeta` and `FavoriteButton` accept a `children: ReactNode` prop for slotting in action buttons. In most frameworks this becomes a named or default slot (`<slot>` in Vue/Svelte). Identify all usages of `children` before starting.

### 4. Profile Tabs Without Nested Routes

The `Profile` page detects the active tab via `location.pathname.endsWith('/favorites')` rather than using nested routes. This is simple to port — just read the current URL path — but if your framework encourages nested routing, you may want to restore the nested route approach instead.

### 5. Lazy Loading and Code Splitting

Every page is wrapped in `React.lazy`. Ensure the new framework's router supports per-route code splitting to keep the initial bundle size comparable.

### 6. Markdown Rendering

`parseMarkdown` returns sanitized HTML that is injected via `dangerouslySetInnerHTML`. The equivalent in other frameworks is `v-html` (Vue), `{@html ...}` (Svelte), or `innerHTML` binding. DOMPurify sanitization **must** be preserved regardless of how it is injected.

### 7. TypeScript Strictness

The project uses `verbatimModuleSyntax` (all type-only imports require `import type`) and `erasableSyntaxOnly` (no TypeScript enums). These constraints are tsconfig options, not React-specific, and should be preserved in the new project.

---

## Component Dependency Graph

```
App (root)
├── Header               ← auth store, router
├── Routes
│   ├── Home             ← ArticleList, TagsService, auth store, router params
│   ├── Auth             ← UserService, ListErrors, router
│   ├── Article          ← ArticlesService, CommentsService, auth store
│   │   ├── ArticleMeta
│   │   ├── FavoriteButton  ← ArticlesService, auth store, router
│   │   ├── FollowButton    ← ProfileService, auth store, router
│   │   └── ArticleComment  ← auth store
│   ├── Editor           ← ArticlesService, auth store, ListErrors, router
│   ├── Settings         ← UserService, auth store, ListErrors, router
│   └── Profile          ← ProfileService, auth store, router
│       ├── FollowButton
│       └── ArticleList
│           └── ArticlePreview
│               ├── ArticleMeta
│               └── FavoriteButton
├── Footer
└── ScrollToTop          ← router (location)
```

**Shared everywhere:** `ListErrors`, `defaultImage`

---

## What Does NOT Need to Change

| Item | Reason |
|---|---|
| `src/types/index.ts` | Pure TypeScript interfaces |
| `src/lib/jwt.ts` | Plain `localStorage` functions |
| `src/lib/api.ts` | Axios works in any framework |
| `src/lib/defaultImage.ts` | Plain function |
| `src/lib/markdown.ts` | `marked` + `DOMPurify` are framework-agnostic |
| `src/services/*.ts` | Plain async functions returning Promises |
| `public/assets/` | Static assets |
| `index.html` CDN links | Ionicons + Google Fonts |
