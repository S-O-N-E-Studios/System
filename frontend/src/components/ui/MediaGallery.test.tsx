import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import MediaGallery from './MediaGallery';
import type { ProjectFile } from '@/types';

const media = [
  {
    id: '1',
    originalName: 'site-1.jpg',
    mediaType: 'image',
    captureDate: '2026-04-10T00:00:00.000Z',
  },
  {
    id: '2',
    originalName: 'drone.mp4',
    mediaType: 'video',
    captureDate: '2026-04-11T00:00:00.000Z',
  },
] as unknown as ProjectFile[];

describe('MediaGallery', () => {
  it('renders media items', () => {
    render(
      <MediaGallery
        media={media}
        canUpload={false}
        canDelete={false}
        onUpload={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('site-1.jpg')).toBeInTheDocument();
    expect(screen.getByText('drone.mp4')).toBeInTheDocument();
  });

  it('filters by media type', () => {
    render(
      <MediaGallery
        media={media}
        canUpload={false}
        canDelete={false}
        onUpload={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Images' }));
    expect(screen.getByText('site-1.jpg')).toBeInTheDocument();
    expect(screen.queryByText('drone.mp4')).not.toBeInTheDocument();
  });
});

