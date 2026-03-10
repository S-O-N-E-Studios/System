import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import LottieAnimation from './LottieAnimation';

const stubAnimation = { v: '5.5.7', fr: 30, ip: 0, op: 60, w: 100, h: 100, layers: [] };

describe('LottieAnimation', () => {
  it('renders with aria-label when provided', () => {
    render(<LottieAnimation animationData={stubAnimation} ariaLabel="Loading animation" />);
    expect(screen.getByLabelText('Loading animation')).toBeInTheDocument();
  });

  it('sets role="img" when ariaLabel is provided', () => {
    render(<LottieAnimation animationData={stubAnimation} ariaLabel="Animation" />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('does not set role when ariaLabel is not provided', () => {
    const { container } = render(<LottieAnimation animationData={stubAnimation} />);
    expect(container.querySelector('[role="img"]')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<LottieAnimation animationData={stubAnimation} className="w-32 h-32" ariaLabel="test" />);
    const el = screen.getByLabelText('test');
    expect(el.className).toContain('w-32');
  });
});
