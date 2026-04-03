import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FileManager from './FileManager';
import { useUiStore } from '@/store/uiStore';

describe('FileManager mock download fallback', () => {
  beforeEach(() => {
    useUiStore.setState({
      toasts: [],
      activeModal: null,
      modalData: null,
    });
  });

  it('shows an error toast when downloading mock files without blobUrl', () => {
    render(<FileManager />);

    const downloadButtons = screen.getAllByText('Download');
    expect(downloadButtons.length).toBeGreaterThan(0);

    fireEvent.click(downloadButtons[0]);

    const toasts = useUiStore.getState().toasts;
    expect(toasts.some((t) => t.message === 'Download is not available for mock files yet.')).toBe(true);
  });
});

