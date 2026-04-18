import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies sahara-card class', () => {
    const { container } = render(<Card>Hi</Card>);
    expect(container.firstChild).toHaveClass('sahara-card');
  });

  it('applies financial variant', () => {
    const { container } = render(<Card variant="financial">KPI</Card>);
    expect(container.firstChild).toHaveClass('sahara-card--financial');
  });
});
