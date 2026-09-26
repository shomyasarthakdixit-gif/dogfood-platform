import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Hello</Badge>);
    expect(screen.getByText('Hello')).toBeDefined();
  });

  it('renders success variant', () => {
    render(<Badge variant="success">Submitted</Badge>);
    const el = screen.getByText('Submitted');
    expect(el.className).toContain('success');
  });

  it('renders error variant', () => {
    render(<Badge variant="error">Error</Badge>);
    const el = screen.getByText('Error');
    expect(el.className).toContain('error');
  });

  it('renders info variant', () => {
    render(<Badge variant="info">Info</Badge>);
    const el = screen.getByText('Info');
    expect(el.className).toContain('info');
  });

  it('applies dot class', () => {
    render(<Badge dot>Open</Badge>);
    const el = screen.getByText('Open');
    expect(el.className).toContain('dot');
  });

  it('defaults to default variant', () => {
    render(<Badge>Default</Badge>);
    const el = screen.getByText('Default');
    expect(el.className).toContain('default');
  });
});
