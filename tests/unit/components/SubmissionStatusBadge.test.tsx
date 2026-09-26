import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SubmissionStatusBadge from '@/components/participant/SubmissionStatusBadge';

describe('SubmissionStatusBadge', () => {
  it('renders "Submitted" for SUBMITTED status', () => {
    render(<SubmissionStatusBadge status="SUBMITTED" />);
    expect(screen.getByText('Submitted')).toBeDefined();
  });

  it('renders "Draft" for DRAFT status', () => {
    render(<SubmissionStatusBadge status="DRAFT" />);
    expect(screen.getByText('Draft')).toBeDefined();
  });

  it('uses success variant for SUBMITTED', () => {
    render(<SubmissionStatusBadge status="SUBMITTED" />);
    const el = screen.getByText('Submitted');
    expect(el.className).toContain('success');
  });

  it('uses warning variant for DRAFT', () => {
    render(<SubmissionStatusBadge status="DRAFT" />);
    const el = screen.getByText('Draft');
    expect(el.className).toContain('warning');
  });
});
