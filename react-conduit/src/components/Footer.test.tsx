import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Footer } from './Footer';

const wrap = () => render(<MemoryRouter><Footer /></MemoryRouter>);

describe('Footer', () => {
  it('renders the Conduit logo link', () => {
    wrap();
    expect(screen.getByRole('link', { name: 'Conduit' })).toBeInTheDocument();
  });

  it('contains the current year', () => {
    wrap();
    expect(
      screen.getByText(new RegExp(String(new Date().getFullYear())))
    ).toBeInTheDocument();
  });

  it('renders the RealWorld OSS Project link', () => {
    wrap();
    expect(
      screen.getByRole('link', { name: /RealWorld OSS Project/i })
    ).toBeInTheDocument();
  });

  it('has a footer element', () => {
    const { container } = wrap();
    expect(container.querySelector('footer')).toBeInTheDocument();
  });
});
