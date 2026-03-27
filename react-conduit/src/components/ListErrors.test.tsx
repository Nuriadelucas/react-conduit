import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ListErrors } from './ListErrors';

describe('ListErrors', () => {
  it('renders nothing when errors is null', () => {
    const { container } = render(<ListErrors errors={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders one <li> per message (single field, single message)', () => {
    render(<ListErrors errors={{ errors: { email: ['is invalid'] } }} />);
    expect(screen.getByText('email is invalid')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('renders one <li> per message (single field, multiple messages)', () => {
    render(<ListErrors errors={{ errors: { email: ['is invalid', 'is taken'] } }} />);
    expect(screen.getByText('email is invalid')).toBeInTheDocument();
    expect(screen.getByText('email is taken')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders messages from multiple fields', () => {
    render(
      <ListErrors
        errors={{ errors: { username: ['is taken'], password: ['is too short'] } }}
      />
    );
    expect(screen.getByText('username is taken')).toBeInTheDocument();
    expect(screen.getByText('password is too short')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders the error list with the correct class name', () => {
    render(<ListErrors errors={{ errors: { title: ['can\'t be blank'] } }} />);
    expect(document.querySelector('.error-messages')).toBeInTheDocument();
  });
});
