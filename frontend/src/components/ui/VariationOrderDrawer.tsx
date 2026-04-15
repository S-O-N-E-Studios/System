import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import Button from './Button';
import type { VariationOrder } from '@/types';
import { formatRands } from '@/utils/formatters';

interface VariationOrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selected?: VariationOrder | null;
  canCreate: boolean;
  canApprove: boolean;
  onCreate: (payload: { description: string; reason: string; estimatedAmount: number }) => Promise<void> | void;
  onSubmit: (voId: string) => Promise<void> | void;
  onApprove: (voId: string) => Promise<void> | void;
  onReject: (voId: string, reason: string) => Promise<void> | void;
}

export default function VariationOrderDrawer({
  isOpen,
  onClose,
  selected,
  canCreate,
  canApprove,
  onCreate,
  onSubmit,
  onApprove,
  onReject,
}: VariationOrderDrawerProps) {
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const isCreateMode = useMemo(() => !selected, [selected]);
  const selectedId =
    (selected as VariationOrder & { _id?: string } | null)?.id ||
    (selected as VariationOrder & { _id?: string } | null)?._id ||
    '';
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <aside className="fixed top-16 right-4 z-50 w-[calc(100%-2rem)] max-w-lg max-h-[calc(100vh-5rem)] overflow-auto border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-h3">{isCreateMode ? 'New Variation Order' : selected.variationNumber}</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isCreateMode ? (
          <div className="space-y-3">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description of variation"
              className="w-full min-h-[90px] border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-2 text-sm"
            />
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for change"
              className="w-full min-h-[90px] border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-2 text-sm"
            />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Estimated amount in cents (negative allowed)"
              className="w-full border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-2 text-sm"
            />
            <Button
              variant="primary"
              disabled={!canCreate}
              onClick={() => {
                const parsed = Number(amount);
                if (!description.trim() || !reason.trim() || Number.isNaN(parsed)) return;
                void onCreate({
                  description: description.trim(),
                  reason: reason.trim(),
                  estimatedAmount: parsed,
                });
              }}
            >
              Create Variation Order
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">{selected.description}</p>
            <p className="text-sm text-[var(--text-secondary)]">{selected.reason}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-3">
                <p className="text-xs text-[var(--text-muted)]">Estimated</p>
                <p className="text-currency">{formatRands(selected.estimatedAmount)}</p>
              </div>
              <div className="border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-3">
                <p className="text-xs text-[var(--text-muted)]">Approved</p>
                <p className="text-currency">{selected.approvedAmount != null ? formatRands(selected.approvedAmount) : 'Pending'}</p>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Status: {selected.status.replace(/_/g, ' ')}</p>

            {selected.status === 'draft' && canCreate && (
              <Button variant="secondary" onClick={() => void onSubmit(selectedId)}>
                Submit for Approval
              </Button>
            )}

            {selected.status === 'pending_approval' && canApprove && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button variant="primary" onClick={() => void onApprove(selectedId)}>
                    Approve
                  </Button>
                </div>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection"
                  className="w-full min-h-[72px] border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-2 text-sm"
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (!rejectReason.trim()) return;
                    void onReject(selectedId, rejectReason.trim());
                  }}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

