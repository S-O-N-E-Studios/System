import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import SuccessAnimation from './SuccessAnimation';

describe('SuccessAnimation', () => {
  it('renders with default "Success" aria label', () => {
    render(<SuccessAnimation />);
    expect(screen.getByLabelText('Success')).toBeInTheDocument();
  });

  it('renders with custom aria label', () => {
    render(<SuccessAnimation ariaLabel="Upload complete" />);
    expect(screen.getByLabelText('Upload complete')).toBeInTheDocument();
  });

  it('applies custom className for sizing', () => {
    render(<SuccessAnimation className="w-48 h-48" />);
    const anim = screen.getByLabelText('Success');
    expect(anim.className).toContain('w-48');
  });

  it('renders inside a rounded container', () => {
    const { container } = render(<SuccessAnimation />);
    const circle = container.querySelector('.rounded-full');
    expect(circle).toBeInTheDocument();
  });

  it('uses default w-24 h-24 when no className provided', () => {
    render(<SuccessAnimation />);
    const anim = screen.getByLabelText('Success');
    expect(anim.className).toContain('w-24');
    expect(anim.className).toContain('h-24');
  });
});
