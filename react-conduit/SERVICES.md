# Services Reference

Services are plain TypeScript modules in `src/services/`. They are thin wrappers over the shared Axios instance (`src/lib/api.ts`) and return `Promise<AxiosResponse<T>>`.

All requests are automatically processed by the two Axios interceptors:
1. **Request interceptor** — adds `Authorization: Token <jwt>` if a token is stored
2. **Response interceptor** — handles 401s and normalizes error responses

---

## API Layer (`src/lib/api.ts`)

A pre-configured Axios instance. All service functions import this instead of `axios` directly.

**Base URL:** `https://api.realworld.show/api`

### Request Interceptor

Reads the JWT via `getToken()` and injects the header on every outgoing request:

```
Authorization: Token <jwt>
```

### Response Interceptor

Catches all HTTP errors and:

- **401 responses** (except `GET /user`): calls `destroyToken()` and redirects to `/login` via `window.location.href`.
- **All errors**: normalizes the rejection to a consistent shape:

```ts
{ errors: { [key: string]: string[] }, status: number }
```

If the server doesn't return an `errors` body, a generic error is synthesized:

```ts
{ errors: { network: ['Unable to connect. Please check your internet connection.'] } }
```

---

## JWT Helpers (`src/lib/jwt.ts`)

Plain functions over `localStorage`. No HTTP calls.

| Function | Signature | Description |
|---|---|---|
| `getToken` | `() => string \| null` | Returns the stored JWT or `null` |
| `saveToken` | `(token: string) => void` | Writes to `localStorage['jwtToken']` |
| `destroyToken` | `() => void` | Removes the key from `localStorage` |

---

## Auth Store (`src/store/auth.tsx`)

React Context provider + `useAuth` hook. This is not a service file but is the primary interface for auth state in components.

### `useAuth()` — returned values

| Value | Type | Description |
|---|---|---|
| `currentUser` | `User \| null` | The logged-in user, or `null` |
| `authState` | `AuthState` | `'loading' \| 'authenticated' \| 'unauthenticated' \| 'unavailable'` |
| `setAuth` | `(user: User) => void` | Saves token + sets user state to `authenticated` |
| `purgeAuth` | `() => void` | Destroys token + sets state to `unauthenticated` |

### Auth State Machine

| State | Meaning |
|---|---|
| `loading` | App just started; JWT validation in progress |
| `authenticated` | JWT validated; `currentUser` is populated |
| `unauthenticated` | No token, or 4xx response during validation |
| `unavailable` | Server error (5xx) during validation |

---

## `src/services/user.ts`

| Function | HTTP | Description |
|---|---|---|
| `login(credentials)` | `POST /users/login` | Authenticates with email + password. Returns `{ user: User }`. |
| `register(credentials)` | `POST /users` | Creates a new account. Returns `{ user: User }`. |
| `updateUser(user)` | `PUT /user` | Updates the logged-in user's settings. Returns `{ user: User }`. |

### Payloads

```ts
// login
{ email: string; password: string }

// register
{ username: string; email: string; password: string }

// updateUser
Partial<User> & { password?: string }
// password is only included when non-empty
```

---

## `src/services/articles.ts`

| Function | HTTP | Description |
|---|---|---|
| `queryArticles(config)` | `GET /articles` or `GET /articles/feed` | Paginated article list. Returns `{ articles, articlesCount }`. |
| `getArticle(slug)` | `GET /articles/:slug` | Single article. Returns `{ article }`. |
| `createArticle(article)` | `POST /articles` | Creates a new article. Returns `{ article }`. |
| `updateArticle(article)` | `PUT /articles/:slug` | Updates an article (`article.slug` required). Returns `{ article }`. |
| `deleteArticle(slug)` | `DELETE /articles/:slug` | Deletes an article. |
| `favoriteArticle(slug)` | `POST /articles/:slug/favorite` | Favorites an article. Returns `{ article }` with updated counts. |
| `unfavoriteArticle(slug)` | `DELETE /articles/:slug/favorite` | Removes a favorite. Returns `{ article }` with updated counts. |

### ArticleListConfig

```ts
interface ArticleListConfig {
  type: 'all' | 'feed';
  filters: {
    tag?:       string;   // filter by tag
    author?:    string;   // filter by author username
    favorited?: string;   // filter by username who favorited
    limit?:     number;   // articles per page (default 10)
    offset?:    number;   // pagination offset (default 0)
  };
}
```

When `type === 'feed'`, the request goes to `GET /articles/feed` (personal following feed). All other types use `GET /articles`.

---

## `src/services/comments.ts`

| Function | HTTP | Description |
|---|---|---|
| `getComments(slug)` | `GET /articles/:slug/comments` | Returns `{ comments: Comment[] }`. |
| `addComment(slug, body)` | `POST /articles/:slug/comments` | Creates a comment. Returns `{ comment }`. |
| `deleteComment(slug, id)` | `DELETE /articles/:slug/comments/:id` | Deletes a comment by numeric ID. |

---

## `src/services/tags.ts`

| Function | HTTP | Description |
|---|---|---|
| `getTags()` | `GET /tags` | Returns `{ tags: string[] }` — popular tags for the sidebar. |

---

## `src/services/profile.ts`

| Function | HTTP | Description |
|---|---|---|
| `getProfile(username)` | `GET /profiles/:username` | Returns `{ profile: Profile }`. |
| `followUser(username)` | `POST /profiles/:username/follow` | Follows a user. Returns `{ profile }` with `following: true`. |
| `unfollowUser(username)` | `DELETE /profiles/:username/follow` | Unfollows a user. Returns `{ profile }` with `following: false`. |

---

## Utility Helpers

### `src/lib/defaultImage.ts`

```ts
defaultImage(image: string | null | undefined): string
```

Returns the image URL if truthy, otherwise `/assets/default-avatar.svg`. Used on every avatar `<img>` in the app.

### `src/lib/markdown.ts`

```ts
parseMarkdown(content: string): Promise<string>
```

Parses a Markdown string to HTML using `marked`, then sanitizes the output with `DOMPurify` to prevent XSS. Used in `Article.tsx` via `dangerouslySetInnerHTML`.
