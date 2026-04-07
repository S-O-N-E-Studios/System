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

  it('downloads a mock placeholder and shows a success toast when blobUrl is absent', () => {
    render(<FileManager />);

    const downloadButtons = screen.getAllByText('Download');
    expect(downloadButtons.length).toBeGreaterThan(0);

    fireEvent.click(downloadButtons[0]);

    const toasts = useUiStore.getState().toasts;
    expect(
      toasts.some((t) =>
        t.message.includes('Downloaded mock placeholder') && t.message.includes('signed URLs'),
      ),
    ).toBe(true);
  });
});

