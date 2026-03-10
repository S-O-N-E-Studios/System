import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FormInput from './FormInput';

describe('FormInput', () => {
  it('renders label text', () => {
    render(<FormInput label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders input element', () => {
    render(<FormInput label="Email" placeholder="Enter email" />);
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('passes input type through', () => {
    render(<FormInput label="Age" type="number" />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('shows error message when error prop is set', () => {
    render(<FormInput label="Email" error="Email is required" />);
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('applies error styling to border', () => {
    const { container } = render(<FormInput label="Email" error="Required" />);
    const input = container.querySelector('input')!;
    expect(input.className).toContain('border-[var(--status-danger)]');
  });

  it('can be disabled', () => {
    render(<FormInput label="Email" disabled placeholder="enter" />);
    expect(screen.getByPlaceholderText('enter')).toBeDisabled();
  });

  describe('password toggle', () => {
    it('renders as password type when isPassword', () => {
      const { container } = render(<FormInput label="Password" isPassword />);
      const input = container.querySelector('input')!;
      expect(input).toHaveAttribute('type', 'password');
    });

    it('toggles to text type when eye icon clicked', () => {
      const { container } = render(<FormInput label="Password" isPassword />);
      const input = container.querySelector('input')!;
      const toggle = screen.getByLabelText('Show password');

      fireEvent.click(toggle);
      expect(input).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
    });

    it('toggles back to password type on second click', () => {
      const { container } = render(<FormInput label="Password" isPassword />);
      const input = container.querySelector('input')!;

      fireEvent.click(screen.getByLabelText('Show password'));
      fireEvent.click(screen.getByLabelText('Hide password'));
      expect(input).toHaveAttribute('type', 'password');
    });

    it('does not show toggle for non-password inputs', () => {
      render(<FormInput label="Email" />);
      expect(screen.queryByLabelText('Show password')).not.toBeInTheDocument();
    });
  });
});
