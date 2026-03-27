# React Conduit

> ### React + Vite + TypeScript codebase containing real world examples (CRUD, auth, advanced patterns, etc) that adheres to the [RealWorld](https://realworld.show) spec and API.

A complete migration of the [Angular Conduit](../angular-conduit/) app to React 18, built with Vite and TypeScript.

## Getting started

Requires [Node.js](https://nodejs.org/) 18+.

```bash
git clone https://github.com/Nuriadelucas/react-conduit.git
cd react-conduit
npm install
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port).

### Building for production

```bash
npm run build      # Type-check + bundle to dist/
npm run preview    # Serve the production build locally
```

## Functionality overview

Conduit is a social blogging platform (Medium clone). It uses the shared [RealWorld API](https://api.realworld.show/api) for all requests including authentication.

**Features:**

- Authenticate users via JWT (login/signup pages + logout in settings)
- Create, read, update, delete articles (with Markdown body)
- Comment on articles
- Favorite articles and follow other users
- Paginated article feeds — global, personal (following), and tag-filtered
- Public user profiles with posts and favorited articles tabs

**Pages:**

| URL | Page |
|---|---|
| `/` | Home feed (global articles + tag sidebar) |
| `/?feed=following` | Personal feed (requires login) |
| `/tag/:tag` | Home feed filtered by tag |
| `/login` | Sign in |
| `/register` | Sign up |
| `/settings` | Account settings (requires login) |
| `/editor` | Create new article (requires login) |
| `/editor/:slug` | Edit existing article (requires login) |
| `/article/:slug` | Full article view with comments |
| `/profile/:username` | User profile — their posts |
| `/profile/:username/favorites` | User profile — their favorited articles |

## Tech stack

| Tool | Purpose |
|---|---|
| [React 18](https://react.dev) | UI library |
| [Vite](https://vite.dev) | Build tool and dev server |
| [TypeScript](https://www.typescriptlang.org) | Type safety (`strict`, `verbatimModuleSyntax`, `erasableSyntaxOnly`) |
| [React Router v6](https://reactrouter.com) | Client-side routing |
| [Axios](https://axios-http.com) | HTTP client |
| [marked](https://marked.js.org) + [DOMPurify](https://github.com/cure53/DOMPurify) | Markdown rendering with XSS sanitization |

## Project documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — Project structure, routing, auth state, data flow
- [COMPONENTS.md](COMPONENTS.md) — Component reference (inputs, outputs, dependencies)
- [SERVICES.md](SERVICES.md) — Service and API layer reference

## License

MIT
