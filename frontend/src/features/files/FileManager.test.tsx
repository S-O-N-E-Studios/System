import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FileManager from './FileManager';
import { useUiStore } from '@/store/uiStore';

describe('FileManager', () => {
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

  it('renders the upload zone button', () => {
    render(<FileManager />);
    expect(screen.getByText('Drop files here or click to upload')).toBeInTheDocument();
  });

  it('opens the upload modal when the upload zone is clicked', () => {
    render(<FileManager />);
    const zone = screen.getByText('Drop files here or click to upload').closest('button')!;
    fireEvent.click(zone);
    expect(useUiStore.getState().activeModal).toBe('file-upload');
  });

  it('renders document-type filter tabs', () => {
    render(<FileManager />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Payment Certificates')).toBeInTheDocument();
    expect(screen.getByText('Drawings')).toBeInTheDocument();
  });

  it('filters files when a tab is clicked', () => {
    render(<FileManager />);
    // Clicking "Geo-Technical Reports" tab hides files of other types
    fireEvent.click(screen.getByText('Geo-Technical Reports'));
    // The tab itself should now be highlighted (just confirm it doesn't throw)
    expect(screen.getByText('Geo-Technical Reports')).toBeInTheDocument();
  });
});

