import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Button from '@/components/ui/Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeDefined();
  });

  it('renders as disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('renders as disabled when loading', () => {
    render(<Button loading>Loading</Button>);
    const btn = screen.getByRole('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute('aria-busy')).toBe('true');
  });

  it('applies primary variant class by default', () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('primary');
  });

  it('applies secondary variant class', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('secondary');
  });

  it('applies fullWidth class', () => {
    render(<Button fullWidth>Wide</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('fullWidth');
  });

  it('renders as anchor when as="a"', () => {
    render(<Button as="a" href="/test">Link</Button>);
    const link = screen.getByRole('link', { name: 'Link' });
    expect(link.tagName.toLowerCase()).toBe('a');
  });

  it('calls onClick handler', async () => {
    let clicked = false;
    render(<Button onClick={() => { clicked = true; }}>Click</Button>);
    screen.getByRole('button').click();
    expect(clicked).toBe(true);
  });
});
