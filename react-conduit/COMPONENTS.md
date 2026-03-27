# Component Reference

All components are functional React components written in TypeScript. No class components are used.

---

## Layout

### `Header`

**File:** `src/components/Header.tsx`

Top navigation bar shown on every page. Renders different links depending on auth state:

| Auth state | Links shown |
|---|---|
| `loading` | Home + "Loading..." |
| `unauthenticated` | Home + Sign in + Sign up |
| `authenticated` | Home + New Article + Settings + Profile (with avatar) |
| `unavailable` | Home + New Article + Settings + "Connecting..." |

**Dependencies:** `useAuth`, `NavLink`, `Link`, `defaultImage`

---

### `Footer`

**File:** `src/components/Footer.tsx`

Static footer with the Conduit logo link, current year copyright, and a link to the RealWorld project.

**Dependencies:** `Link`

---

## Shared

### `ListErrors`

**File:** `src/components/ListErrors.tsx`

Displays API or form validation errors as a `<ul>`. Accepts an `Errors` object and flattens it to one `<li>` per message.

| Prop | Type | Description |
|---|---|---|
| `errors` | `Errors \| null` | Error object from the API or `null` to render nothing |

**Dependencies:** none (pure display)

---

## Article Feature

### `ArticleList`

**File:** `src/components/ArticleList.tsx`

Fetches and renders a paginated list of articles. Handles loading, error, and empty states. Derives a stable `configKey` string from the config object to use as a `useEffect` dependency (avoids object identity issues).

| Prop | Type | Description |
|---|---|---|
| `config` | `ArticleListConfig` | Which articles to fetch (type + filters) |
| `limit` | `number` | Articles per page |
| `currentPage` | `number` | Active page number (1-based) |
| `isFollowingFeed` | `boolean` | Whether to call `/articles/feed` instead of `/articles` |
| `onPageChange` | `(page: number) => void` | Called when the user clicks a page number |

**Dependencies:** `ArticlePreview`, `articlesService`

---

### `ArticlePreview`

**File:** `src/components/ArticlePreview.tsx`

A single article card: title, description, author info, date, tag list, and favorite count. Maintains local article state so the favorite count updates optimistically on toggle.

| Prop | Type | Description |
|---|---|---|
| `article` | `Article` | The article to display |

**Dependencies:** `ArticleMeta`, `FavoriteButton`, `Link`

---

### `ArticleMeta`

**File:** `src/components/ArticleMeta.tsx`

The author row shown on article cards and the article detail page: avatar, author name link, and publication date. Accepts a `children` slot for action buttons (edit/delete/favorite/follow).

| Prop | Type | Description |
|---|---|---|
| `article` | `Article` | Article whose author info is displayed |
| `children` | `ReactNode` | Action buttons rendered to the right |

**Dependencies:** `Link`, `defaultImage`

---

### `ArticleComment`

**File:** `src/components/ArticleComment.tsx`

Renders a single comment card: author avatar, author name, date, and comment body. Shows a delete button only when the logged-in user is the comment author.

| Prop | Type | Description |
|---|---|---|
| `comment` | `Comment` | The comment to display |
| `onDelete` | `() => void` | Called when the delete button is clicked |

**Dependencies:** `useAuth`, `Link`, `defaultImage`

---

### `FavoriteButton`

**File:** `src/components/FavoriteButton.tsx`

Heart icon button for favoriting/unfavoriting an article. Redirects to `/register` if the user is not authenticated. Accepts optional `children` for custom button label text.

| Prop | Type | Description |
|---|---|---|
| `article` | `Article` | Article to favorite/unfavorite |
| `onToggle` | `(favorited: boolean) => void` | Called with the new favorited state after the API responds |
| `children` | `ReactNode` (optional) | Button label; falls back to the article's `favoritesCount` |

**Dependencies:** `useAuth`, `articlesService`, `useNavigate`

---

### `FollowButton`

**File:** `src/components/FollowButton.tsx`

Follow/unfollow toggle button for a user profile. Redirects to `/login` if the user is not authenticated.

| Prop | Type | Description |
|---|---|---|
| `profile` | `Profile` | Profile to follow/unfollow |
| `onToggle` | `(profile: Profile) => void` | Called with the updated profile after the API responds |

**Dependencies:** `useAuth`, `profileService`, `useNavigate`

---

## Pages

All pages are lazy-loaded via `React.lazy` in `App.tsx`.

### `Home`

**File:** `src/pages/Home.tsx`

The main feed page. Shows "Your Feed" / "Global Feed" tabs, a tag-filtered view when a tag is active, and a popular tags sidebar. Reads the current tab from URL search params (`?feed=following`) and the active tag from route params (`/tag/:tag`). Redirects to `/login` if `?feed=following` is accessed while unauthenticated.

**State:** `tags`, `page` (from `useSearchParams`), `config` (memoized from params)

**Dependencies:** `ArticleList`, `TagsService`, `useAuth`, `useParams`, `useSearchParams`, `NavLink`, `Link`

---

### `Auth`

**File:** `src/pages/Auth.tsx`

Dual-purpose login and register page. Detects which mode it's in from `location.pathname`. Resets the form state when switching between `/login` and `/register`. Disables the form while submitting.

**Dependencies:** `useAuth`, `userService`, `ListErrors`, `useNavigate`, `useLocation`, `Link`

---

### `Article`

**File:** `src/pages/Article.tsx`

Full article detail page. Loads the article and its comments in parallel (`Promise.all`). Parses the article body from Markdown to sanitized HTML in a separate `useEffect`. Shows edit/delete controls only to the article's author. Handles add and delete comments.

**State:** `article`, `comments`, `parsedBody`, `loadError`, `commentBody`, `commentErrors`, `isSubmittingComment`, `isDeleting`

**Dependencies:** `ArticleMeta`, `FavoriteButton`, `FollowButton`, `ArticleComment`, `ListErrors`, `articlesService`, `commentsService`, `parseMarkdown`, `defaultImage`, `useAuth`

---

### `Editor`

**File:** `src/pages/Editor.tsx`

Create or edit article form. `slug` from `useParams` determines the mode — if present, the article is fetched, ownership is verified, and the form is pre-filled. Tag management: tags are stored as `string[]`; the tag input adds a tag on Enter (deduplicated) and any uncommitted input is flushed into the tag list on form submit.

**State:** `title`, `description`, `body`, `tagList`, `tagInput`, `errors`, `isSubmitting`

**Dependencies:** `articlesService`, `ListErrors`, `useAuth`, `useParams`, `useNavigate`

---

### `Profile`

**File:** `src/pages/Profile.tsx`

Public profile page for any user. Detects the active tab from `location.pathname.endsWith('/favorites')` — no nested routing required. Resets the article list page to 1 when switching tabs or navigating to a different user. Shows "Edit Profile Settings" if viewing own profile, `FollowButton` otherwise.

**State:** `profile`, `loadError`, `page`

**Dependencies:** `ArticleList`, `FollowButton`, `ListErrors`, `profileService`, `defaultImage`, `useAuth`, `useParams`, `useLocation`, `NavLink`, `Link`

---

### `Settings`

**File:** `src/pages/Settings.tsx`

Account settings form. Pre-populates fields from `currentUser` on mount. Sends the password field only when non-empty. On success, calls `setAuth()` with the updated user and navigates to their profile. The logout button calls `purgeAuth()` and redirects to `/`.

**State:** `image`, `username`, `bio`, `email`, `password`, `errors`, `isSubmitting`

**Dependencies:** `useAuth`, `userService`, `ListErrors`, `useNavigate`
