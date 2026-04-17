import { useState } from 'react';
import Button from './Button';

interface ClientApprovalPanelProps {
  canApprove: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'not_required';
  onApprove?: () => Promise<void> | void;
  onReject?: (reason: string) => Promise<void> | void;
  onNotifyClient?: () => Promise<void> | void;
  notificationSentAt?: string;
  notificationSentCount?: number;
  isLoading?: boolean;
}

export default function ClientApprovalPanel({
  canApprove,
  approvalStatus = 'not_required',
  onApprove,
  onReject,
  onNotifyClient,
  notificationSentAt,
  notificationSentCount = 0,
  isLoading = false,
}: ClientApprovalPanelProps) {
  const [reason, setReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  if (approvalStatus !== 'pending') return null;

  if (!canApprove) {
    return (
      <div className="mt-3 p-3 border border-[var(--status-review)] bg-[var(--accent-sand-glow)]">
        <p className="text-[12px] text-[var(--status-review)]">
          Waiting on client approval. A client approver must approve or reject this document before progression.
        </p>
        <p className="text-[11px] text-[var(--text-muted)] mt-1">
          Notifications sent: {notificationSentCount}
          {notificationSentAt ? ` · Last sent ${new Date(notificationSentAt).toLocaleString()}` : ''}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 border border-[var(--border-default)] bg-[var(--bg-surface-alt)]">
      <p className="text-[12px] text-[var(--text-secondary)] mb-2">
        Client approval required before this stage can advance.
      </p>
      <p className="text-[11px] text-[var(--text-muted)] mb-2">
        Notifications sent: {notificationSentCount}
        {notificationSentAt ? ` · Last sent ${new Date(notificationSentAt).toLocaleString()}` : ''}
      </p>
      <div className="flex items-center gap-2 mb-2">
        <Button variant="primary" onClick={onApprove} isLoading={isLoading} className="!py-1.5 !px-3 text-[12px]">
          Approve
        </Button>
        <Button
          variant="secondary"
          onClick={() => setShowReject((v) => !v)}
          className="!py-1.5 !px-3 text-[12px]"
        >
          Reject
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            void onNotifyClient?.();
          }}
          isLoading={isLoading}
          className="!py-1.5 !px-3 text-[12px]"
        >
          Notify Client
        </Button>
      </div>
      {showReject && (
        <div className="space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter rejection reason"
            className="w-full min-h-[72px] text-[12px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-2"
          />
          <Button
            variant="secondary"
            onClick={() => {
              if (!reason.trim()) return;
              void onReject?.(reason.trim());
            }}
            isLoading={isLoading}
            className="!py-1.5 !px-3 text-[12px]"
          >
            Submit Rejection
          </Button>
        </div>
      )}
    </div>
  );
}

