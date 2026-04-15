import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DatePicker from './DatePicker';

describe('DatePicker', () => {
  it('renders a date input with the provided label', () => {
    render(<DatePicker label="Due date" value="2026-04-17" onChange={() => {}} />);
    expect(screen.getByText('Due date')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-04-17')).toBeInTheDocument();
  });

  it('defaults to type="date"', () => {
    render(<DatePicker label="Date" value="" onChange={() => {}} />);
    // input[type="date"] is not role="textbox", query directly
    const el = document.querySelector('input[type="date"]') as HTMLInputElement;
    expect(el).not.toBeNull();
    expect(el.type).toBe('date');
  });

  it('calls onChange when user picks a date', () => {
    const onChange = vi.fn();
    render(<DatePicker label="Start" value="" onChange={onChange} />);
    const input = document.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2026-05-01' } });
    expect(onChange).toHaveBeenCalledWith('2026-05-01');
  });

  it('renders an error message when error prop is provided', () => {
    render(<DatePicker label="Appointment" value="" onChange={() => {}} error="Date is required" />);
    expect(screen.getByText('Date is required')).toBeInTheDocument();
  });

  it('renders a required asterisk when required prop is set', () => {
    const { container } = render(<DatePicker label="Due" value="" onChange={() => {}} required />);
    expect(container.querySelector('span[class*="danger"]') ?? container.querySelector('span')).toBeTruthy();
  });

  it('disables the input when disabled prop is set', () => {
    render(<DatePicker label="Date" value="" onChange={() => {}} disabled />);
    const input = document.querySelector('input') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('renders time input when type="time"', () => {
    render(<DatePicker label="Time" type="time" value="09:00" onChange={() => {}} />);
    const el = document.querySelector('input[type="time"]') as HTMLInputElement;
    expect(el).not.toBeNull();
    expect(el.value).toBe('09:00');
  });

  it('renders datetime-local input when type="datetime-local"', () => {
    render(<DatePicker label="Datetime" type="datetime-local" value="" onChange={() => {}} />);
    const el = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
    expect(el).not.toBeNull();
  });

  it('renders without a label when label is omitted', () => {
    render(<DatePicker value="2026-01-01" onChange={() => {}} />);
    const input = document.querySelector('input') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.value).toBe('2026-01-01');
  });

  it('applies min and max constraints', () => {
    render(<DatePicker label="d" value="" onChange={() => {}} min="2026-01-01" max="2026-12-31" />);
    const input = document.querySelector('input') as HTMLInputElement;
    expect(input.min).toBe('2026-01-01');
    expect(input.max).toBe('2026-12-31');
  });
});
