import { useMemo, useState } from 'react';
import Button from './Button';
import type { ProjectFile } from '@/types';

interface MediaGalleryProps {
  media: ProjectFile[];
  canUpload: boolean;
  canDelete: boolean;
  onUpload: (file: File, mediaType: 'image' | 'video', captureDate?: string, description?: string) => Promise<void> | void;
  onDelete: (mediaId: string) => Promise<void> | void;
}

export default function MediaGallery({
  media,
  canUpload,
  canDelete,
  onUpload,
  onDelete,
}: MediaGalleryProps) {
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [captureDate, setCaptureDate] = useState('');
  const [description, setDescription] = useState('');

  const filtered = useMemo(() => {
    if (filter === 'all') return media;
    return media.filter((m) => m.mediaType === filter);
  }, [media, filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 text-xs border border-[var(--border-default)]" onClick={() => setFilter('all')}>All</button>
          <button className="px-2 py-1 text-xs border border-[var(--border-default)]" onClick={() => setFilter('image')}>Images</button>
          <button className="px-2 py-1 text-xs border border-[var(--border-default)]" onClick={() => setFilter('video')}>Videos</button>
        </div>
      </div>

      {canUpload && (
        <div className="border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-3">
          <p className="text-xs text-[var(--text-secondary)] mb-2">Upload site evidence</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="date"
              value={captureDate}
              onChange={(e) => setCaptureDate(e.target.value)}
              className="border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1 text-xs"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1 text-xs flex-1"
            />
            <label className="inline-flex">
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
                  void onUpload(file, mediaType, captureDate || undefined, description || undefined);
                  e.currentTarget.value = '';
                }}
              />
              <Button variant="secondary">Choose File</Button>
            </label>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No media found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item) => {
            const itemId = (item as ProjectFile & { _id?: string }).id || (item as ProjectFile & { _id?: string })._id || '';
            const label = item.originalName || item.filename || 'Untitled media';
            const isVideo = item.mediaType === 'video';
            return (
              <article key={itemId} className="border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
                <div className="aspect-video border border-[var(--border-default)] bg-[var(--bg-surface-alt)] flex items-center justify-center text-xs text-[var(--text-muted)] mb-2">
                  {isVideo ? 'Video' : 'Image'}
                </div>
                <p className="text-xs font-medium text-[var(--text-primary)] truncate">{label}</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  {item.captureDate ? new Date(item.captureDate).toLocaleDateString('en-GB') : 'No date'}
                </p>
                {canDelete && (
                  <div className="mt-2">
                    <Button variant="secondary" className="!py-1 !px-2 text-[11px]" onClick={() => void onDelete(itemId)}>
                      Remove
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

