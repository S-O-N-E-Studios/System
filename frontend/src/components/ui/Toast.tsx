import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import type { Toast as ToastType } from '@/types';

const iconMap = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

const colorMap = {
  success: 'var(--status-active)',
  warning: 'var(--status-review)',
  error: 'var(--status-danger)',
  info: 'var(--status-planning)',
};

function ToastItem({ toast }: { toast: ToastType }) {
  const { removeToast } = useUiStore();
  const Icon = iconMap[toast.type];
  const color = colorMap[toast.type];

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] shadow-lg min-w-[320px] max-w-[420px] animate-fade-in"
      role="alert"
      style={{ borderLeftColor: color, borderLeftWidth: '3px' }}
    >
      <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color }} />
      <p className="flex-1 text-[0.82rem] font-body font-light text-[var(--text-primary)]">
        {toast.message}
      </p>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useUiStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
