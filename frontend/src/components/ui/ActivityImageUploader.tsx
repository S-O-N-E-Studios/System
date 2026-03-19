import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import type { SupportingImage } from '@/types';

interface ActivityImageUploaderProps {
  activityId: string;
  activityName: string;
  isComplete: boolean;
  images: SupportingImage[];
  onUpload?: (activityId: string, file: File, caption?: string) => Promise<void>;
  onRemove?: (activityId: string, fileId: string) => Promise<void>;
}

export default function ActivityImageUploader({
  activityId,
  activityName,
  isComplete,
  images,
  onUpload,
  onRemove,
}: ActivityImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [caption, setCaption] = useState('');

  const isMissing = isComplete && images.length === 0;

  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!onUpload || acceptedFiles.length === 0) return;
      setIsUploading(true);
      try {
        for (const file of acceptedFiles) {
          await onUpload(activityId, file, caption || undefined);
        }
        setCaption('');
      } finally {
        setIsUploading(false);
      }
    },
    [activityId, caption, onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    disabled: isUploading,
  });

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-[var(--accent-periwinkle)]" />
          <h4 className="text-[0.82rem] font-medium text-[var(--text-primary)]">
            Supporting Images
          </h4>
        </div>
        {isMissing && (
          <span
            className="flex items-center gap-1 text-[0.65rem] font-semibold text-[var(--status-danger)] uppercase tracking-wider"
            data-testid="missing-images-badge"
          >
            <AlertTriangle className="h-3 w-3" />
            Required
          </span>
        )}
      </div>

      <p className="text-[0.72rem] text-[var(--text-muted)] mb-4">
        {activityName}
        {isComplete && (
          <span className="text-[var(--status-danger)]">; completed activity, images required for project completion</span>
        )}
      </p>

      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
          {images.map((img) => (
            <div
              key={img.fileId}
              className="relative group aspect-square bg-[var(--bg-surface-alt)] border border-[var(--border-default)] flex items-center justify-center overflow-hidden"
            >
              <ImageIcon className="h-6 w-6 text-[var(--text-muted)]" />
              {img.caption && (
                <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-[0.55rem] text-white px-1 py-0.5 truncate">
                  {img.caption}
                </span>
              )}
              {onRemove && (
                <button
                  onClick={() => onRemove(activityId, img.fileId)}
                  className="absolute top-1 right-1 h-5 w-5 bg-[var(--status-danger)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {onUpload && (
        <>
          <div className="mb-3">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (optional)"
              className="w-full bg-transparent border-0 border-b border-[var(--border-default)] py-1.5 text-[0.78rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-sand)] focus:outline-none transition-[border-color] duration-200"
            />
          </div>

          <div
            {...getRootProps()}
            className={[
              'border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
              isDragActive
                ? 'border-[var(--accent-periwinkle)] bg-[var(--accent-sand-glow)]'
                : 'border-[var(--border-default)] hover:border-[var(--accent-sand)]',
            ].join(' ')}
          >
            <input {...getInputProps()} />
            <Upload className="h-5 w-5 mx-auto mb-2 text-[var(--text-muted)]" />
            <p className="text-[0.72rem] text-[var(--text-muted)]">
              {isDragActive
                ? 'Drop images here'
                : 'Drag and drop images, or click to select'}
            </p>
            <p className="text-[0.6rem] text-[var(--text-muted)] mt-1">
              JPG, PNG, WebP; max 10MB per file
            </p>
          </div>

          {isUploading && (
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1 flex-1 bg-[var(--bg-surface-alt)] overflow-hidden">
                <div className="h-full w-1/2 bg-[var(--accent-periwinkle)] animate-pulse" />
              </div>
              <span className="text-[0.6rem] text-[var(--text-muted)]">Uploading…</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
