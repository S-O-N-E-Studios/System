import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Sheet, Files, Download, Loader } from 'lucide-react';
import Button from '@/components/ui/Button';

export type ExportFormat = 'pdf' | 'xlsx' | 'both';

interface FormatOption {
  id: ExportFormat;
  label: string;
  description: string;
  Icon: React.ElementType;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: 'pdf',
    label: 'PDF',
    description: 'Formatted report, ready to print or share.',
    Icon: FileText,
  },
  {
    id: 'xlsx',
    label: 'Excel',
    description: 'Spreadsheet for further analysis.',
    Icon: Sheet,
  },
  {
    id: 'both',
    label: 'Both',
    description: 'Download PDF and Excel at once.',
    Icon: Files,
  },
];

export interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Screen / data label shown in the header. E.g. "Dashboard", "Grants". */
  context?: string;
  /** Called with the chosen format after the user clicks Export. Close is handled automatically. */
  onExport: (format: ExportFormat) => Promise<void> | void;
}

export default function ExportDialog({ isOpen, onClose, context, onExport }: ExportDialogProps) {
  const [selected, setSelected] = useState<ExportFormat | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  // Reset state each time dialog opens.
  useEffect(() => {
    if (isOpen) {
      setSelected(null);
      setLoading(false);
      setExportError(null);
      prevFocusRef.current = document.activeElement as HTMLElement;
      panelRef.current?.focus();
    } else {
      prevFocusRef.current?.focus();
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (loading) return;
    onClose();
  }, [loading, onClose]);

  // Keyboard: Escape closes; focus trap re-queries live so it works while buttons are disabled.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        // Re-query every keydown so the list stays accurate when loading disables buttons.
        const focusable = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => !el.hasAttribute('disabled'));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleClose]);

  const handleExport = async () => {
    if (!selected || loading) return;
    setLoading(true);
    setExportError(null);
    try {
      await onExport(selected);
      // Only close after a successful export — errors stay visible for retry.
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed. Please try again.';
      setExportError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const title = context ? `Export · ${context}` : 'Export';

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-md mx-4 bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <Download className="h-4 w-4 text-[var(--accent)]" />
            <h2
              id="export-dialog-title"
              className="text-h3"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors disabled:opacity-40"
            aria-label="Close"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Format options */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-[0.72rem] text-[var(--text-muted)] mb-4">
            Choose a format to download.
          </p>
          {FORMAT_OPTIONS.map(({ id, label, description, Icon }) => {
            const isSelected = selected === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelected(id)}
                disabled={loading}
                className={[
                  'w-full flex items-center gap-4 px-4 py-3.5 text-left transition-all',
                  'border focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
                  isSelected
                    ? 'border-[var(--accent)] bg-[var(--accent-light)]'
                    : 'border-[var(--border)] hover:border-[var(--border-emphasis)] hover:bg-[var(--bg-surface-alt)]',
                  loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                ].join(' ')}
                aria-pressed={isSelected}
              >
                <div
                  className={[
                    'flex items-center justify-center w-9 h-9 flex-shrink-0 border',
                    isSelected
                      ? 'border-[var(--accent)] bg-[var(--accent-light)]'
                      : 'border-[var(--border)] bg-[var(--bg-surface-alt)]',
                  ].join(' ')}
                >
                  <Icon
                    className="h-4 w-4"
                    style={{ color: isSelected ? 'var(--accent)' : 'var(--text-muted)' }}
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className="text-[0.85rem] font-semibold"
                    style={{ color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}
                  >
                    {label}
                  </p>
                  <p className="text-[0.68rem] text-[var(--text-muted)] mt-0.5">{description}</p>
                </div>
                {/* Selection indicator */}
                <div className="ml-auto flex-shrink-0">
                  <div
                    className={[
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
                      isSelected ? 'border-[var(--accent)]' : 'border-[var(--border-emphasis)]',
                    ].join(' ')}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
          {exportError && (
            <p className="mr-auto text-[0.72rem] text-[var(--status-danger)] leading-snug max-w-[55%]">
              {exportError}
            </p>
          )}
          <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => void handleExport()}
            disabled={!selected || loading}
          >
            {loading ? (
              <>
                <Loader className="h-3.5 w-3.5 animate-spin" />
                Exporting…
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                Export
              </>
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
