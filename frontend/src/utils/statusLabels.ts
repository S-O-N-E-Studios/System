import type { ApprovalStatus } from '@/types';

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  approved: 'Approved',
  pending: 'Pending',
  rejected: 'Rejected',
  not_required: 'Not Required',
};

export function procurementStepStatusLabel(status: 'approved' | 'not_approved' | 'not_applicable') {
  if (status === 'not_approved') return 'Not Approved';
  if (status === 'not_applicable') return 'Not Applicable';
  return 'Approved';
}
