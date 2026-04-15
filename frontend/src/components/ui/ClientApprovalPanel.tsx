import { useState } from 'react';
import Button from './Button';

interface ClientApprovalPanelProps {
  canApprove: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'not_required';
  onApprove?: () => Promise<void> | void;
  onReject?: (reason: string) => Promise<void> | void;
  isLoading?: boolean;
}

export default function ClientApprovalPanel({
  canApprove,
  approvalStatus = 'not_required',
  onApprove,
  onReject,
  isLoading = false,
}: ClientApprovalPanelProps) {
  const [reason, setReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  if (!canApprove || approvalStatus !== 'pending') return null;

  return (
    <div className="mt-3 p-3 border border-[var(--border-default)] bg-[var(--bg-surface-alt)]">
      <p className="text-[12px] text-[var(--text-secondary)] mb-2">
        Client approval required before this stage can advance.
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

