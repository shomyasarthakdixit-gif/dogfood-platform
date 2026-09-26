import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No events" />);
    expect(screen.getByText('No events')).toBeDefined();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="Empty" description="Nothing here yet." />);
    expect(screen.getByText('Nothing here yet.')).toBeDefined();
  });

  it('renders actions when provided', () => {
    render(
      <EmptyState
        title="No teams"
        actions={<Button>Create team</Button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Create team' })).toBeDefined();
  });

  it('has role="status"', () => {
    render(<EmptyState title="No data" />);
    expect(screen.getByRole('status')).toBeDefined();
  });

  it('renders icon slot', () => {
    const { container } = render(
      <EmptyState
        title="No icon"
        icon={<span data-testid="icon">🔍</span>}
      />
    );
    expect(container.querySelector('[data-testid="icon"]')).toBeDefined();
  });
});
