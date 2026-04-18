import type { ReactNode } from 'react';
import type { ExtensionOfTimeRequest, PenaltyRecord, PerformanceSnapshot } from '@/api/workflow';
import Button from '@/components/ui/Button';

type Props = {
  expandedPerformance: boolean;
  expandedEot: boolean;
  expandedPenalties: boolean;
  onTogglePerformance: () => void;
  onToggleEot: () => void;
  onTogglePenalties: () => void;
  latestPerformance: PerformanceSnapshot | null;
  onCapturePerformance: () => void;
  isCapturingPerformance: boolean;
  canEditWorkflow: boolean;
  canApproveWorkflow: boolean;
  eotRequests: ExtensionOfTimeRequest[];
  penalties: PenaltyRecord[];
  onOpenEotCreate: () => void;
  onSubmitEot: (eotId: string) => void;
  onApproveEot: (eotId: string, requestedDays: number) => void;
  onRejectEot: (eotId: string) => void;
  onWithdrawEot: (eotId: string) => void;
  onOpenPenaltyCreate: () => void;
  onSubmitPenalty: (penaltyId: string) => void;
  onApprovePenalty: (penaltyId: string) => void;
  onRejectPenalty: (penaltyId: string) => void;
  onWaivePenalty: (penaltyId: string) => void;
  isBusy: {
    createEot: boolean;
    submitEot: boolean;
    approveEot: boolean;
    rejectEot: boolean;
    withdrawEot: boolean;
    createPenalty: boolean;
    submitPenalty: boolean;
    approvePenalty: boolean;
    rejectPenalty: boolean;
    waivePenalty: boolean;
  };
  formatIdShort: (id?: string | null) => string;
  renderFileChip: (opts: { fileId?: string | null; label?: string; key?: string }) => ReactNode;
};

export default function Stage4ConstructionPanel({
  expandedPerformance,
  expandedEot,
  expandedPenalties,
  onTogglePerformance,
  onToggleEot,
  onTogglePenalties,
  latestPerformance,
  onCapturePerformance,
  isCapturingPerformance,
  canEditWorkflow,
  canApproveWorkflow,
  eotRequests,
  penalties,
  onOpenEotCreate,
  onSubmitEot,
  onApproveEot,
  onRejectEot,
  onWithdrawEot,
  onOpenPenaltyCreate,
  onSubmitPenalty,
  onApprovePenalty,
  onRejectPenalty,
  onWaivePenalty,
  isBusy,
  formatIdShort,
  renderFileChip,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-4 space-y-3">
        <button type="button" className="w-full flex items-center justify-between" onClick={onTogglePerformance}>
          <h4 className="text-h3 text-[0.9rem]">Performance Snapshot</h4>
          <span className="text-[0.68rem] text-[var(--text-muted)]">{expandedPerformance ? 'Hide' : 'Show'}</span>
        </button>
        {expandedPerformance &&
          (latestPerformance ? (
            <div className="space-y-2">
              <Button
                type="button"
                variant="secondary"
                className="!py-1.5 !px-2.5 !text-[0.68rem]"
                onClick={onCapturePerformance}
                isLoading={isCapturingPerformance}
              >
                Capture
              </Button>
              <div className="space-y-1">
                <p className="text-[0.74rem] text-[var(--text-primary)]">Period: {latestPerformance.period}</p>
                <p className="text-[0.7rem] text-[var(--text-muted)]">
                  Consultant RAG: {latestPerformance.consultant.rag}
                </p>
                <p className="text-[0.7rem] text-[var(--text-muted)]">
                  Construction RAG: {latestPerformance.construction.rag}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[0.72rem] text-[var(--text-muted)]">No snapshot yet.</p>
          ))}
      </div>

      <div className="border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-4 space-y-3">
        <button type="button" className="w-full flex items-center justify-between" onClick={onToggleEot}>
          <h4 className="text-h3 text-[0.9rem]">Extension of Time</h4>
          <span className="text-[0.68rem] text-[var(--text-muted)]">{expandedEot ? 'Hide' : 'Show'}</span>
        </button>
        {expandedEot && (
          <div className="space-y-2">
            {canEditWorkflow && (
              <Button
                type="button"
                variant="secondary"
                className="!py-1.5 !px-2.5 !text-[0.68rem]"
                onClick={onOpenEotCreate}
                isLoading={isBusy.createEot}
              >
                New
              </Button>
            )}
            {eotRequests.length === 0 ? (
              <p className="text-[0.72rem] text-[var(--text-muted)]">No EOT requests.</p>
            ) : (
              eotRequests.slice(0, 3).map((row) => (
                <div key={row._id} className="border border-[var(--border-default)] p-2 space-y-1">
                  <p className="text-[0.72rem] text-[var(--text-primary)]">
                    {row.referenceNumber} · {row.status} · {row.requestedDays} days
                  </p>
                  {row.assignedApproverId ? (
                    <p className="text-[0.68rem] text-[var(--text-muted)]">
                      Approver: {formatIdShort(row.assignedApproverId)}
                    </p>
                  ) : null}
                  {row.thresholdExceeded ? (
                    <p className="text-[0.68rem] text-[var(--status-warning)]">
                      Threshold exceeded
                      {row.requestedDaysThreshold ? ` (${row.requestedDaysThreshold} days)` : ''}
                    </p>
                  ) : null}
                  {row.thresholdWarningNote ? (
                    <p className="text-[0.68rem] text-[var(--text-muted)]">{row.thresholdWarningNote}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-1">
                    {renderFileChip({ fileId: row.consultantRecommendationFileId, label: 'Consultant', key: `${row._id}-consultant` })}
                    {renderFileChip({ fileId: row.pmuRecommendationFileId, label: 'PMU', key: `${row._id}-pmu` })}
                    {renderFileChip({ fileId: row.approvalFileId, label: 'Approval', key: `${row._id}-approval` })}
                    {(row.supportingFileIds || []).slice(0, 3).map((fileId) =>
                      renderFileChip({ fileId, label: 'Support', key: `${row._id}-${fileId}` })
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {row.status === 'draft' && canEditWorkflow && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="!py-1 !px-2 !text-[0.64rem]"
                        onClick={() => onSubmitEot(row._id)}
                        isLoading={isBusy.submitEot}
                      >
                        Submit
                      </Button>
                    )}
                    {row.status === 'pending_approval' && canApproveWorkflow && (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          className="!py-1 !px-2 !text-[0.64rem]"
                          onClick={() => onApproveEot(row._id, row.requestedDays)}
                          isLoading={isBusy.approveEot}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="!py-1 !px-2 !text-[0.64rem]"
                          onClick={() => onRejectEot(row._id)}
                          isLoading={isBusy.rejectEot}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {row.status === 'pending_approval' && canEditWorkflow && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="!py-1 !px-2 !text-[0.64rem]"
                        onClick={() => onWithdrawEot(row._id)}
                        isLoading={isBusy.withdrawEot}
                      >
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-4 space-y-3">
        <button type="button" className="w-full flex items-center justify-between" onClick={onTogglePenalties}>
          <h4 className="text-h3 text-[0.9rem]">Penalties</h4>
          <span className="text-[0.68rem] text-[var(--text-muted)]">{expandedPenalties ? 'Hide' : 'Show'}</span>
        </button>
        {expandedPenalties && (
          <div className="space-y-2">
            {canEditWorkflow && (
              <Button
                type="button"
                variant="secondary"
                className="!py-1.5 !px-2.5 !text-[0.68rem]"
                onClick={onOpenPenaltyCreate}
                isLoading={isBusy.createPenalty}
              >
                New
              </Button>
            )}
            {penalties.length === 0 ? (
              <p className="text-[0.72rem] text-[var(--text-muted)]">No penalties recorded.</p>
            ) : (
              penalties.slice(0, 3).map((row) => (
                <div key={row._id} className="border border-[var(--border-default)] p-2 space-y-1">
                  <p className="text-[0.72rem] text-[var(--text-primary)]">
                    {row.penaltyType} · R{(row.amountCents / 100).toFixed(2)} · {row.status}
                  </p>
                  {row.assignedApproverId ? (
                    <p className="text-[0.68rem] text-[var(--text-muted)]">
                      Approver: {formatIdShort(row.assignedApproverId)}
                    </p>
                  ) : null}
                  {row.thresholdExceeded ? (
                    <p className="text-[0.68rem] text-[var(--status-warning)]">
                      Threshold exceeded
                      {typeof row.thresholdAmountCents === 'number' ? ` (R${(row.thresholdAmountCents / 100).toFixed(2)})` : ''}
                    </p>
                  ) : null}
                  {row.thresholdWarningNote ? (
                    <p className="text-[0.68rem] text-[var(--text-muted)]">{row.thresholdWarningNote}</p>
                  ) : null}
                  {row.rejectionReason ? (
                    <p className="text-[0.68rem] text-[var(--status-danger)]">Reason: {row.rejectionReason}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-1">
                    {(row.supportingFileIds || []).slice(0, 4).map((fileId) =>
                      renderFileChip({ fileId, label: 'Support', key: `${row._id}-${fileId}` })
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {row.status === 'draft' && canEditWorkflow && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="!py-1 !px-2 !text-[0.64rem]"
                        onClick={() => onSubmitPenalty(row._id)}
                        isLoading={isBusy.submitPenalty}
                      >
                        Submit
                      </Button>
                    )}
                    {row.status === 'pending_approval' && canApproveWorkflow && (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          className="!py-1 !px-2 !text-[0.64rem]"
                          onClick={() => onApprovePenalty(row._id)}
                          isLoading={isBusy.approvePenalty}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="!py-1 !px-2 !text-[0.64rem]"
                          onClick={() => onRejectPenalty(row._id)}
                          isLoading={isBusy.rejectPenalty}
                        >
                          Reject
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="!py-1 !px-2 !text-[0.64rem]"
                          onClick={() => onWaivePenalty(row._id)}
                          isLoading={isBusy.waivePenalty}
                        >
                          Waive
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
