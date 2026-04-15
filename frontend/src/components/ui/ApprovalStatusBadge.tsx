import type { ApprovalStatus } from '@/types';

interface ApprovalStatusBadgeProps {
  status?: ApprovalStatus;
}

const labelByStatus: Record<ApprovalStatus, string> = {
  approved: 'Approved',
  pending: 'Pending',
  rejected: 'Rejected',
  not_required: 'Not Required',
};

const classByStatus: Record<ApprovalStatus, string> = {
  approved: 'bg-[var(--status-success)]/10 text-[var(--status-success)] border-[var(--status-success)]/30',
  pending: 'bg-[var(--status-warning)]/10 text-[var(--status-warning)] border-[var(--status-warning)]/30',
  rejected: 'bg-[var(--status-danger)]/10 text-[var(--status-danger)] border-[var(--status-danger)]/30',
  not_required: 'bg-[var(--bg-surface-alt)] text-[var(--text-muted)] border-[var(--border-default)]',
};

export default function ApprovalStatusBadge({ status = 'not_required' }: ApprovalStatusBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-1 text-[11px] font-medium border',
        classByStatus[status],
      ].join(' ')}
    >
      {labelByStatus[status]}
    </span>
  );
}

