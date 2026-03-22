import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it('renders children text', () => {
    render(<StatusBadge status="active">Active</StatusBadge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('has aria-live="polite"', () => {
    render(<StatusBadge status="active">Active</StatusBadge>);
    expect(screen.getByText('Active')).toHaveAttribute('aria-live', 'polite');
  });

  const statuses = ['active', 'review', 'planning', 'done', 'danger', 'accent'] as const;

  statuses.forEach((status) => {
    it(`renders ${status} variant without error`, () => {
      render(<StatusBadge status={status}>{status}</StatusBadge>);
      expect(screen.getByText(status)).toBeInTheDocument();
    });

    it(`applies colored border for ${status} variant`, () => {
      render(<StatusBadge status={status}>{status}</StatusBadge>);
      const badge = screen.getByText(status);
      expect(badge.style.border).toContain('1px solid');
    });
  });

  it('active variant uses green color', () => {
    render(<StatusBadge status="active">On Track</StatusBadge>);
    const badge = screen.getByText('On Track');
    expect(badge.style.color).toBe('var(--status-success)');
  });

  it('danger variant uses red color', () => {
    render(<StatusBadge status="danger">Critical</StatusBadge>);
    const badge = screen.getByText('Critical');
    expect(badge.style.color).toBe('var(--status-danger)');
  });

  it('accent variant uses accent color', () => {
    render(<StatusBadge status="accent">Highlighted</StatusBadge>);
    const badge = screen.getByText('Highlighted');
    expect(badge.style.color).toBe('var(--accent-sand)');
  });
});
