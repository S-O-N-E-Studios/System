import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders title text', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <EmptyState
        title="No data"
        description="Add some items to get started."
      />
    );
    expect(screen.getByText('Add some items to get started.')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<EmptyState title="Empty" />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(1);
  });

  it('renders Lottie animation with "No data" aria label', () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.getByLabelText('No data')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyState title="Test" className="my-custom-class" />);
    expect(container.firstElementChild?.className).toContain('my-custom-class');
  });

  it('applies custom animation className', () => {
    render(<EmptyState title="Test" animationClassName="w-48 h-48" />);
    const anim = screen.getByLabelText('No data');
    expect(anim.className).toContain('w-48');
  });
});
