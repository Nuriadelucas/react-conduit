/**
 * Re-exports the auth context from src/store/auth.tsx so both import paths work:
 *
 *   import { useAuth } from '../store/auth';         // original path
 *   import { useAuth } from '../contexts/AuthContext'; // Angular-style path
 *
 * State shape mirrors Angular's UserService:
 *   currentUser  — the authenticated User object, or null
 *   authState    — 'loading' | 'authenticated' | 'unauthenticated' | 'unavailable'
 *   setAuth      — saves JWT + sets currentUser (Angular: UserService.setAuth)
 *   purgeAuth    — clears JWT + currentUser (Angular: UserService.purgeAuth / logout)
 *
 * JWT is stored in localStorage under the key 'jwtToken', matching
 * Angular's JwtService (window.localStorage['jwtToken']).
 *
 * On mount, AuthProvider calls GET /api/user to rehydrate auth state.
 * Network / 5xx errors set authState to 'unavailable' and trigger an
 * automatic exponential-backoff retry (5 s → 10 s → 20 s, capped at 30 s).
 * 4xx errors call purgeAuth() immediately, matching Angular's handleAuthError.
 */
export { AuthProvider, useAuth } from '../store/auth';
export type { AuthState } from '../store/auth';
