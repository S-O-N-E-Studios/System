import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from './StatCard';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Total Projects" value="24" />);
    expect(screen.getByText('Total Projects')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
  });

  it('renders optional subline', () => {
    render(<StatCard label="Budget" value="R 5M" subline="Year to date" />);
    expect(screen.getByText('Year to date')).toBeInTheDocument();
  });

  it('does not render subline when not provided', () => {
    const { container } = render(<StatCard label="Test" value="0" />);
    const sublines = container.querySelectorAll('.uppercase');
    expect(sublines).toHaveLength(0);
  });

  it('renders icon when provided', () => {
    render(
      <StatCard
        label="Projects"
        value="12"
        icon={<span data-testid="icon">ICON</span>}
      />
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies currency styling when isCurrency is true', () => {
    render(<StatCard label="Revenue" value="R 1,500,000" isCurrency />);
    const valueEl = screen.getByText('R 1,500,000');
    expect(valueEl.className).toContain('text-[var(--accent)]');
  });

  it('applies default styling when isCurrency is false', () => {
    render(<StatCard label="Count" value="42" />);
    const valueEl = screen.getByText('42');
    expect(valueEl.className).toContain('text-[var(--text-primary)]');
  });
});
