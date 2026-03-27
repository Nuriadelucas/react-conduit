import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './store/auth';

export function renderWith(
  ui: ReactElement,
  opts: { initialEntries?: string[] } = {}
) {
  const { initialEntries = ['/'] } = opts;
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </AuthProvider>
  );
}

export * from '@testing-library/react';
