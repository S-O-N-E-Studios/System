import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ApprovalStatusBadge from './ApprovalStatusBadge';

describe('ApprovalStatusBadge', () => {
  it('renders approved label', () => {
    render(<ApprovalStatusBadge status="approved" />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('renders pending label', () => {
    render(<ApprovalStatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('falls back to not required', () => {
    render(<ApprovalStatusBadge />);
    expect(screen.getByText('Not Required')).toBeInTheDocument();
  });
});

