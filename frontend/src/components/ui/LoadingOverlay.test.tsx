import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingOverlay from './LoadingOverlay';

describe('LoadingOverlay', () => {
  it('renders loading animation', () => {
    render(<LoadingOverlay />);
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('applies fullscreen classes by default', () => {
    const { container } = render(<LoadingOverlay />);
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain('fixed');
    expect(wrapper.className).toContain('inset-0');
    expect(wrapper.className).toContain('backdrop-blur');
  });

  it('does not apply fullscreen classes when fullscreen=false', () => {
    const { container } = render(<LoadingOverlay fullscreen={false} />);
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).not.toContain('fixed');
    expect(wrapper.className).not.toContain('inset-0');
  });

  it('renders the rounded animation container', () => {
    const { container } = render(<LoadingOverlay />);
    const circle = container.querySelector('.rounded-full');
    expect(circle).toBeInTheDocument();
  });
});
