import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it('renders children and aria-live politely', () => {
    render(<StatusBadge status="active">Active</StatusBadge>);
    const badge = screen.getByText(/active/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('aria-live', 'polite');
  });
});

