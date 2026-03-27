# Migration Report: Angular → React

This document is the retrospective for the completed migration of [Angular Conduit](../angular-conduit/) to this React project. It covers what was built in each phase, how Angular concepts were translated to React, and the key decisions and challenges encountered.

The original migration plan is at [`angular-conduit/MIGRATION_PLAN.md`](../angular-conduit/MIGRATION_PLAN.md).

---

## Summary

| | Angular (source) | React (target) |
|---|---|---|
| Framework | Angular 21, standalone components | React 18, functional components |
| Language | TypeScript 5.9 | TypeScript (strict + `verbatimModuleSyntax` + `erasableSyntaxOnly`) |
| Build tool | Angular CLI + esbuild | Vite |
| Routing | Angular Router | React Router v6 |
| HTTP | `HttpClient` + 3 interceptors | Axios + 2 interceptors |
| State | Angular Signals + RxJS Observables | `useState` + React Context |
| Reactivity | Zoneless change detection | React re-render model |
| Auth state | `UserService` BehaviorSubject (4-state) | `AuthProvider` React Context (4-state) |
| Lazy loading | `loadComponent` / `loadChildren` | `React.lazy` + `<Suspense>` |
| Markdown | `MarkdownPipe` (async, DomSanitizer) | `parseMarkdown()` (marked + DOMPurify) |
| Templates | Angular HTML templates | JSX |

---

## Phase-by-Phase Summary

### Phase 1 — Foundation

Ported all framework-agnostic code first.

| Angular | React equivalent | File |
|---|---|---|
| `core/models/*.ts` + `features/*/models/*.ts` | Single `types/index.ts` | `src/types/index.ts` |
| `jwt.service.ts` | `jwt.ts` (plain functions) | `src/lib/jwt.ts` |
| `api.interceptor.ts` base URL | Axios `baseURL` config | `src/lib/api.ts` |
| `default-image.pipe.ts` | `defaultImage()` function | `src/lib/defaultImage.ts` |
| `markdown.pipe.ts` | `parseMarkdown()` async function | `src/lib/markdown.ts` |

**Key decision:** `LoadingState` was an `enum` in Angular. TypeScript's `erasableSyntaxOnly` compiler option forbids enums; replaced with an `as const` object + union type:

```ts
// Angular
enum LoadingState { NOT_LOADED, LOADING, LOADED, ERROR }

// React
export const LoadingState = {
  NOT_LOADED: 'NOT_LOADED', LOADING: 'LOADING',
  LOADED: 'LOADED', ERROR: 'ERROR',
} as const;
export type LoadingState = (typeof LoadingState)[keyof typeof LoadingState];
```

---

### Phase 2 — HTTP Services

Each Angular service became a plain TypeScript module exporting functions. The three Angular HTTP interceptors merged into two Axios interceptors on a shared instance.

| Angular interceptor | Axios equivalent |
|---|---|
| `api.interceptor.ts` (prepend base URL) | `baseURL: 'https://api.realworld.show/api'` in `axios.create()` |
| `token.interceptor.ts` (inject JWT header) | `api.interceptors.request.use(...)` |
| `error.interceptor.ts` (normalize errors, handle 401) | `api.interceptors.response.use(null, handler)` |

**Key decision:** Angular services are classes instantiated by the DI system. React has no DI — services became modules of exported functions that all share the same Axios instance by importing it:

```ts
// Angular
@Injectable({ providedIn: 'root' })
export class ArticlesService {
  constructor(private http: HttpClient) {}
  get(slug: string) { return this.http.get(`/articles/${slug}`); }
}

// React
import api from '../lib/api';
export const getArticle = (slug: string) =>
  api.get<{ article: Article }>(`/articles/${slug}`);
```

---

### Phase 3 — Auth State Machine

The most complex piece of the migration. Angular's `UserService` used RxJS `BehaviorSubject` streams. React uses a Context provider with `useState`.

| Angular | React |
|---|---|
| `UserService` with `BehaviorSubject<User \| null>` | `AuthProvider` with `useState<User \| null>` |
| `authState$: Observable<AuthState>` | `authState: AuthState` from `useState` |
| `isAuthenticated: Observable<boolean>` | Derived: `currentUser !== null` |
| `provideAppInitializer(initAuth)` | `useEffect([], ...)` in `AuthProvider` |
| `requireAuth` route guard | `RequireAuth` layout-route component |

**Key decision:** The Angular app had exponential backoff retry on server errors. The React port simplifies this to a single attempt: if the server is unreachable during the initial token check, the state moves to `unavailable` and the user still has access to public pages. This was an acceptable trade-off to avoid complexity.

**Key decision:** Auth guards became layout-route components using React Router's `<Outlet />` pattern:

```tsx
function RequireAuth() {
  const { authState } = useAuth();
  if (authState === 'loading') return <div>Loading...</div>;
  if (authState === 'unauthenticated') return <Navigate to="/login" replace />;
  return <Outlet />;  // renders the child route
}

// In the route table:
<Route element={<RequireAuth />}>
  <Route path="/settings" element={<Settings />} />
</Route>
```

---

### Phase 4 — Leaf Components

| Angular | React | Notes |
|---|---|---|
| `ListErrorsComponent` | `ListErrors` | Fixed bug: `string[]` was coerced via template literal; replaced with `.flatMap` |
| `FooterComponent` | `Footer` | Direct port |
| `ArticleMetaComponent` + `<ng-content>` | `ArticleMeta` + `children` prop | Angular content projection → React children |
| `ArticleCommentComponent` | `ArticleComment` | Direct port |

---

### Phase 5 — Action Buttons

| Angular | React | Notes |
|---|---|---|
| `FavoriteButtonComponent` | `FavoriteButton` | `<ng-content>` slot → optional `children?: ReactNode` prop |
| `FollowButtonComponent` | `FollowButton` | Direct port |

---

### Phase 6 — Compound Components

| Angular | React | Notes |
|---|---|---|
| `ArticlePreviewComponent` | `ArticlePreview` | Local `article` state for optimistic favorite count update |
| `ArticleListComponent` | `ArticleList` | See `configKey` pattern below |
| `ProfileArticlesComponent` + `ProfileFavoritesComponent` | Merged into `Profile` page | Eliminated Angular's child router outlet by using `location.pathname.endsWith('/favorites')` |

**Key challenge — `ArticleList` config dependency:** Angular passes an `@Input() config: ArticleListConfig` object and re-fetches when it changes using the `OnPush` change detection strategy. In React, passing a config object as a prop causes infinite re-renders if the object is recreated on every render.

**Solution — `configKey` string:** Derive a stable string from the config's primitive values and use that as the `useEffect` dependency:

```ts
const configKey = `${config.type}:${config.filters.tag ?? ''}:${config.filters.author ?? ''}:${config.filters.favorited ?? ''}`;
useEffect(() => { /* fetch */ }, [configKey, currentPage, limit]);
```

---

### Phase 7 — Pages

| Angular | React | Notes |
|---|---|---|
| `AuthComponent` (dual login/register) | `Auth` | Same pattern — `location.pathname` determines mode |
| `SettingsComponent` | `Settings` | Direct port; `useEffect([currentUser])` pre-fills form |
| `EditorComponent` | `Editor` | Direct port; tag flush on submit preserved |
| `ArticleComponent` | `Article` | `combineLatest` → `Promise.all` for parallel loading |
| `HomeComponent` | `Home` | `ActivatedRoute` + params → `useParams` + `useSearchParams` |
| `ProfileComponent` | `Profile` | Angular child routes → `location.pathname` check |

---

### Phase 8 — App Shell and Routing

| Angular | React | Notes |
|---|---|---|
| `AppComponent` + `<router-outlet>` | `AppLayout` with `<Routes>` | Direct structural equivalent |
| `app.routes.ts` with `loadComponent` | `React.lazy` + `<Suspense>` | Same lazy-loading effect |
| `HeaderComponent` | `Header` | All 4 auth-state variants preserved |
| `provideZonelessChangeDetection()` | n/a | React has no zone concept |
| `IfAuthenticatedDirective` | Inline `{authState === 'authenticated' && ...}` | No equivalent directive needed in JSX |

**Added in Phase 8 (not in original plan):**
- `ScrollToTop` component — restores scroll position on route change (Angular Router does this automatically; React Router does not)
- Fixed trailing slash bug: `POST /articles/` → `POST /articles`

---

## Angular → React Concept Mapping

| Angular concept | React equivalent |
|---|---|
| `@Component({ standalone: true })` | Function component (`export function Foo()`) |
| `@Injectable({ providedIn: 'root' })` | Module-level singleton (imported directly) |
| `@Input() prop: T` | Prop in function signature: `({ prop }: { prop: T })` |
| `@Output() event = new EventEmitter<T>()` | Callback prop: `onEvent: (value: T) => void` |
| `<ng-content>` content projection | `children: ReactNode` prop |
| `*ngIf="condition"` | `{condition && <Element />}` |
| `*ngFor="let x of list"` | `{list.map(x => <Element key={x.id} />)}` |
| `[class.active]="condition"` | `className={condition ? 'active' : ''}` |
| `(click)="handler()"` | `onClick={handler}` |
| `[(ngModel)]="value"` | `value={value} onChange={e => setValue(e.target.value)}` |
| `ActivatedRoute.params` | `useParams()` |
| `ActivatedRoute.queryParams` | `useSearchParams()` |
| `Router.navigate(['/path'])` | `useNavigate()` → `navigate('/path')` |
| `RouterLink` | `<Link to="/path">` |
| `RouterLinkActive` | `<NavLink className={({ isActive }) => ...}>` |
| `<router-outlet>` | `<Outlet />` (in layout routes) or `<Routes>/<Route>` |
| `loadComponent` lazy route | `React.lazy(() => import('./Page'))` |
| `ChangeDetectionStrategy.OnPush` | React's default re-render model (functional components) |
| Angular Signals (`signal()`, `computed()`) | `useState`, `useMemo` |
| RxJS `Observable` | `Promise` (for one-shot HTTP calls) |
| RxJS `combineLatest` | `Promise.all` |
| `AsyncPipe` (`obs \| async`) | `useEffect` + `useState` |
| `DatePipe` | `new Date(str).toLocaleDateString(...)` |
| `DomSanitizer.bypassSecurityTrustHtml` | `dangerouslySetInnerHTML={{ __html: sanitized }}` |
| `MarkdownPipe` (async pipe) | `parseMarkdown()` called in `useEffect` |
| `DefaultImagePipe` | `defaultImage()` utility function |
| Structural directive (`*ifAuthenticated`) | Inline conditional render in JSX |

---

## Key Decisions

1. **No state management library.** All state is local `useState` or React Context (`AuthProvider`). The app is small enough that Redux / Zustand / React Query would be over-engineering.

2. **Services as modules, not classes.** Angular's `@Injectable` classes became plain module exports. This is simpler and avoids the need for a DI container.

3. **Profile tabs without nested routes.** Angular used child routes (`profile.routes.ts`) to render `ProfileArticlesComponent` or `ProfileFavoritesComponent` inside `ProfileComponent`. React replaces this with a single `Profile` component that reads `location.pathname.endsWith('/favorites')` — no nested routing, fewer files.

4. **`configKey` string over memoization.** `useMemo` on a config object would still produce a new reference when deps change. A derived string is a primitive and works reliably as a `useEffect` dependency.

5. **`unavailable` state kept.** Although the backoff retry was dropped, the `unavailable` state was preserved so the header can show "Connecting..." and authenticated users can still navigate without being logged out on a momentary server hiccup.
