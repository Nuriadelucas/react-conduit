import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { getToken, saveToken, destroyToken } from '../lib/jwt';
import api from '../lib/api';

export type AuthState = 'authenticated' | 'unauthenticated' | 'unavailable' | 'loading';

interface AuthContextValue {
  currentUser: User | null;
  authState: AuthState;
  setAuth: (user: User) => void;
  purgeAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');

  const setAuth = useCallback((user: User) => {
    saveToken(user.token);
    setCurrentUser(user);
    setAuthState('authenticated');
  }, []);

  const purgeAuth = useCallback(() => {
    destroyToken();
    setCurrentUser(null);
    setAuthState('unauthenticated');
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAuthState('unauthenticated');
      return;
    }
    api.get<{ user: User }>('/user')
      .then(({ data }) => setAuth(data.user))
      .catch((err: { status?: number }) => {
        if (err.status && err.status >= 400 && err.status < 500) {
          purgeAuth();
        } else {
          setAuthState('unavailable');
        }
      });
  }, [setAuth, purgeAuth]);

  return (
    <AuthContext.Provider value={{ currentUser, authState, setAuth, purgeAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
