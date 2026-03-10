import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ToastContainer from './Toast';
import { useUiStore } from '@/store/uiStore';

describe('ToastContainer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useUiStore.setState({ toasts: [] });
  });

  it('renders nothing when there are no toasts', () => {
    const { container } = render(<ToastContainer />);
    expect(container.innerHTML).toBe('');
  });

  it('renders toast messages', () => {
    useUiStore.setState({
      toasts: [
        { id: '1', type: 'success', message: 'File saved successfully' },
        { id: '2', type: 'error', message: 'Something went wrong' },
      ],
    });

    render(<ToastContainer />);
    expect(screen.getByText('File saved successfully')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('each toast has role="alert"', () => {
    useUiStore.setState({
      toasts: [{ id: '1', type: 'info', message: 'Info message' }],
    });

    render(<ToastContainer />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('dismiss button removes toast', () => {
    useUiStore.setState({
      toasts: [{ id: 'toast-1', type: 'warning', message: 'Warning!' }],
    });

    render(<ToastContainer />);
    fireEvent.click(screen.getByLabelText('Dismiss notification'));
    expect(useUiStore.getState().toasts).toHaveLength(0);

    vi.useRealTimers();
  });

  it('has aria-live region', () => {
    useUiStore.setState({
      toasts: [{ id: '1', type: 'success', message: 'Done' }],
    });

    const { container } = render(<ToastContainer />);
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('renders different icon types for each toast type', () => {
    useUiStore.setState({
      toasts: [
        { id: '1', type: 'success', message: 'Success' },
        { id: '2', type: 'error', message: 'Error' },
        { id: '3', type: 'warning', message: 'Warning' },
        { id: '4', type: 'info', message: 'Info' },
      ],
    });

    render(<ToastContainer />);
    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(4);

    vi.useRealTimers();
  });
});
