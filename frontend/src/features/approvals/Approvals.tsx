import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import apiClient from '@/api/client';
import LoadingState from '@/components/ui/LoadingState';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import Button from '@/components/ui/Button';
import { useUiStore } from '@/store/uiStore';
import { stageApprovalsApi } from '@/api/stageApprovals';
import { workflowApi } from '@/api/workflow';
import { projectsApi } from '@/api/projects';
import {
  TABLE_BASE,
  TABLE_CELL,
  TABLE_HEAD_CELL,
  TABLE_HEAD_ROW,
  TABLE_ROW_BASE,
  TABLE_SURFACE,
} from '@/utils/tableStyles';

type PendingApprovalSummary = {
  projectId: string;
  projectName: string;
  projectRefCode?: string;
  currentStage?: number;
  stageTopLevel?: number;
  pendingCount: number;
  oldestPendingAt?: string;
};

type PendingStageApprovalItem = {
  approvalId: string;
  projectId: string;
  projectName: string;
  projectRefCode?: string;
  stage: number;
  documentCategory: string;
  fileId?: string;
  createdAt?: string;
};

type PendingEotSummary = {
  eotId: string;
  projectId: string;
  projectName: string;
  projectRefCode?: string;
  requestedDays: number;
  reason?: string;
  createdAt?: string;
};

type PendingPenaltySummary = {
  penaltyId: string;
  projectId: string;
  projectName: string;
  projectRefCode?: string;
  penaltyType: string;
  amountCents: number;
  reason?: string;
  createdAt?: string;
};

type PendingCertificateSummary = {
  certificateId: string;
  projectId: string;
  projectName: string;
  projectRefCode?: string;
  billingPeriod?: string;
  amount: number;
  certificateNo?: string;
  createdAt?: string;
};

export default function Approvals() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  const pendingQuery = useQuery({
    queryKey: ['approvals-pending-summary', tenantSlug],
    queryFn: async () => {
      const res = await apiClient.get(`/${tenantSlug}/approvals/pending-summary`);
      const body = res.data?.data || res.data;
      return {
        stageApprovals: (body?.stageApprovals || body?.items || []) as PendingApprovalSummary[],
        stageApprovalItems: (body?.stageApprovalItems || []) as PendingStageApprovalItem[],
        extensionOfTime: (body?.extensionOfTime || []) as PendingEotSummary[],
        penalties: (body?.penalties || []) as PendingPenaltySummary[],
        interimPaymentCertificates: (body?.interimPaymentCertificates || []) as PendingCertificateSummary[],
      };
    },
    enabled: Boolean(tenantSlug),
  });

  const refreshPending = async () => {
    await queryClient.invalidateQueries({ queryKey: ['approvals-pending-summary', tenantSlug] });
  };

  const approveDocumentMutation = useMutation({
    mutationFn: ({ projectId, approvalId }: { projectId: string; approvalId: string }) =>
      stageApprovalsApi.approve(projectId, approvalId),
    onSuccess: async () => {
      addToast({ type: 'success', message: 'Document approved.' });
      await refreshPending();
    },
    onError: () => addToast({ type: 'error', message: 'Could not approve document.' }),
  });

  const rejectDocumentMutation = useMutation({
    mutationFn: ({ projectId, approvalId, reason }: { projectId: string; approvalId: string; reason: string }) =>
      stageApprovalsApi.reject(projectId, approvalId, reason),
    onSuccess: async () => {
      addToast({ type: 'success', message: 'Document rejected.' });
      await refreshPending();
    },
    onError: () => addToast({ type: 'error', message: 'Could not reject document.' }),
  });

  const approveEotMutation = useMutation({
    mutationFn: ({ projectId, eotId, requestedDays }: { projectId: string; eotId: string; requestedDays?: number }) =>
      workflowApi.approveExtensionOfTime(projectId, eotId, requestedDays ? { daysApproved: requestedDays } : undefined),
    onSuccess: async () => {
      addToast({ type: 'success', message: 'EOT approved.' });
      await refreshPending();
    },
    onError: () => addToast({ type: 'error', message: 'Could not approve EOT.' }),
  });

  const rejectEotMutation = useMutation({
    mutationFn: ({ projectId, eotId, reason }: { projectId: string; eotId: string; reason: string }) =>
      workflowApi.rejectExtensionOfTime(projectId, eotId, { reason }),
    onSuccess: async () => {
      addToast({ type: 'success', message: 'EOT rejected.' });
      await refreshPending();
    },
    onError: () => addToast({ type: 'error', message: 'Could not reject EOT.' }),
  });

  const approvePenaltyMutation = useMutation({
    mutationFn: ({ projectId, penaltyId }: { projectId: string; penaltyId: string }) =>
      workflowApi.approvePenalty(projectId, penaltyId),
    onSuccess: async () => {
      addToast({ type: 'success', message: 'Penalty approved.' });
      await refreshPending();
    },
    onError: () => addToast({ type: 'error', message: 'Could not approve penalty.' }),
  });

  const rejectPenaltyMutation = useMutation({
    mutationFn: ({ projectId, penaltyId, reason }: { projectId: string; penaltyId: string; reason: string }) =>
      workflowApi.rejectPenalty(projectId, penaltyId, { reason }),
    onSuccess: async () => {
      addToast({ type: 'success', message: 'Penalty rejected.' });
      await refreshPending();
    },
    onError: () => addToast({ type: 'error', message: 'Could not reject penalty.' }),
  });

  const approveCertificateMutation = useMutation({
    mutationFn: ({ projectId, certificateId }: { projectId: string; certificateId: string }) =>
      projectsApi.approveInterimPaymentCertificate(projectId, certificateId),
    onSuccess: async () => {
      addToast({ type: 'success', message: 'Certificate approved.' });
      await refreshPending();
    },
    onError: () => addToast({ type: 'error', message: 'Could not approve certificate.' }),
  });

  const rejectCertificateMutation = useMutation({
    mutationFn: ({ projectId, certificateId, reason }: { projectId: string; certificateId: string; reason: string }) =>
      projectsApi.rejectInterimPaymentCertificate(projectId, certificateId, { reason }),
    onSuccess: async () => {
      addToast({ type: 'success', message: 'Certificate rejected.' });
      await refreshPending();
    },
    onError: () => addToast({ type: 'error', message: 'Could not reject certificate.' }),
  });

  const retry = () => {
    void pendingQuery.refetch();
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-h1 mb-2">Approvals</h1>
        <p className="text-body text-[var(--text-muted)]">
          Pending approval workload by project.
        </p>
      </div>

      <div className={TABLE_SURFACE}>
        <div className="px-6 py-4 border-b border-[var(--border-default)]">
          <h2 className="text-h3 text-[0.95rem]">Pending Approvals</h2>
        </div>
        <div className="p-6">
          {pendingQuery.isLoading ? (
            <LoadingState
              title="Loading pending approvals"
              description="Fetching approver workload by project."
              animationClassName="w-16 h-16"
              className="py-6"
            />
          ) : pendingQuery.isError ? (
            <ErrorState
              title="Could not load approvals"
              description="Try again to refresh pending approval data."
              animationClassName="w-16 h-16"
              className="py-6"
              action={
                <Button type="button" variant="secondary" onClick={retry}>
                  Retry
                </Button>
              }
            />
          ) : (
            <>
              {(pendingQuery.data?.stageApprovals?.length || 0) > 0 ? (
            <div className="overflow-x-auto">
              <table className={TABLE_BASE}>
                <thead>
                  <tr className={TABLE_HEAD_ROW}>
                    <th className={TABLE_HEAD_CELL}>Project</th>
                    <th className={TABLE_HEAD_CELL}>Ref</th>
                    <th className={TABLE_HEAD_CELL}>Top Stage</th>
                    <th className={TABLE_HEAD_CELL}>Legacy Stage</th>
                    <th className={TABLE_HEAD_CELL}>Pending</th>
                    <th className={TABLE_HEAD_CELL}>Oldest</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingQuery.data?.stageApprovals?.map((item) => (
                    <tr key={item.projectId} className={TABLE_ROW_BASE}>
                      <td className={TABLE_CELL}>
                        <Link
                          to={`/${tenantSlug}/projects/${item.projectId}`}
                          className="text-[var(--accent)] hover:underline"
                        >
                          {item.projectName || 'Untitled Project'}
                        </Link>
                      </td>
                      <td className={TABLE_CELL}>{item.projectRefCode || '—'}</td>
                      <td className={TABLE_CELL}>{item.stageTopLevel ?? '—'}</td>
                      <td className={TABLE_CELL}>{item.currentStage ?? '—'}</td>
                      <td className={TABLE_CELL}>{item.pendingCount}</td>
                      <td className={TABLE_CELL}>
                        <div className="flex items-center gap-2">
                          <span>
                            {item.oldestPendingAt
                              ? new Date(item.oldestPendingAt).toLocaleDateString('en-GB')
                              : '—'}
                          </span>
                          {item.oldestPendingAt &&
                            (Date.now() - new Date(item.oldestPendingAt).getTime()) / (1000 * 60 * 60 * 24) >= 7 && (
                              <span className="inline-flex items-center border border-[var(--status-warning)]/30 bg-[var(--status-warning)]/10 px-2 py-0.5 text-[0.66rem] text-[var(--status-warning)]">
                                Aging
                              </span>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              ) : null}

              {(pendingQuery.data?.stageApprovalItems?.length || 0) > 0 ? (
                <div className="mt-6 overflow-x-auto">
                  <h3 className="text-[0.82rem] text-[var(--text-muted)] mb-2">Stage Documents Queue</h3>
                  <table className={TABLE_BASE}>
                    <thead>
                      <tr className={TABLE_HEAD_ROW}>
                        <th className={TABLE_HEAD_CELL}>Project</th>
                        <th className={TABLE_HEAD_CELL}>Document</th>
                        <th className={TABLE_HEAD_CELL}>Stage</th>
                        <th className={TABLE_HEAD_CELL}>Queued</th>
                        <th className={TABLE_HEAD_CELL}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingQuery.data?.stageApprovalItems?.map((item) => (
                        <tr key={item.approvalId} className={TABLE_ROW_BASE}>
                          <td className={TABLE_CELL}>
                            <Link to={`/${tenantSlug}/projects/${item.projectId}`} className="text-[var(--accent)] hover:underline">
                              {item.projectName || 'Untitled Project'}
                            </Link>
                            <p className="text-[0.65rem] text-[var(--text-muted)]">{item.projectRefCode || '—'}</p>
                          </td>
                          <td className={TABLE_CELL}>{item.documentCategory}</td>
                          <td className={TABLE_CELL}>{item.stage}</td>
                          <td className={TABLE_CELL}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : '—'}</td>
                          <td className={TABLE_CELL}>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                className="!py-1 !px-2 !text-[0.64rem]"
                                onClick={() => approveDocumentMutation.mutate({ projectId: item.projectId, approvalId: item.approvalId })}
                                isLoading={approveDocumentMutation.isPending}
                              >
                                Approve
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                className="!py-1 !px-2 !text-[0.64rem]"
                                onClick={() => {
                                  const reason = window.prompt('Enter rejection reason');
                                  if (!reason || reason.trim().length < 3) return;
                                  rejectDocumentMutation.mutate({
                                    projectId: item.projectId,
                                    approvalId: item.approvalId,
                                    reason: reason.trim(),
                                  });
                                }}
                                isLoading={rejectDocumentMutation.isPending}
                              >
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {(pendingQuery.data?.extensionOfTime?.length || 0) > 0 ? (
                <div className="mt-6 overflow-x-auto">
                  <h3 className="text-[0.82rem] text-[var(--text-muted)] mb-2">Extension of Time</h3>
                  <table className={TABLE_BASE}>
                    <thead>
                      <tr className={TABLE_HEAD_ROW}>
                        <th className={TABLE_HEAD_CELL}>Project</th>
                        <th className={TABLE_HEAD_CELL}>Ref</th>
                        <th className={TABLE_HEAD_CELL}>Requested Days</th>
                        <th className={TABLE_HEAD_CELL}>Reason</th>
                        <th className={TABLE_HEAD_CELL}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingQuery.data?.extensionOfTime?.map((item) => (
                        <tr key={item.eotId} className={TABLE_ROW_BASE}>
                          <td className={TABLE_CELL}>
                            <Link to={`/${tenantSlug}/projects/${item.projectId}`} className="text-[var(--accent)] hover:underline">
                              {item.projectName || 'Untitled Project'}
                            </Link>
                          </td>
                          <td className={TABLE_CELL}>{item.projectRefCode || '—'}</td>
                          <td className={TABLE_CELL}>{item.requestedDays}</td>
                          <td className={TABLE_CELL}>{item.reason || '—'}</td>
                          <td className={TABLE_CELL}>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                className="!py-1 !px-2 !text-[0.64rem]"
                                onClick={() =>
                                  approveEotMutation.mutate({
                                    projectId: item.projectId,
                                    eotId: item.eotId,
                                    requestedDays: item.requestedDays,
                                  })
                                }
                                isLoading={approveEotMutation.isPending}
                              >
                                Approve
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                className="!py-1 !px-2 !text-[0.64rem]"
                                onClick={() => {
                                  const reason = window.prompt('Enter rejection reason');
                                  if (!reason || reason.trim().length < 3) return;
                                  rejectEotMutation.mutate({
                                    projectId: item.projectId,
                                    eotId: item.eotId,
                                    reason: reason.trim(),
                                  });
                                }}
                                isLoading={rejectEotMutation.isPending}
                              >
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {(pendingQuery.data?.penalties?.length || 0) > 0 ? (
                <div className="mt-6 overflow-x-auto">
                  <h3 className="text-[0.82rem] text-[var(--text-muted)] mb-2">Penalties</h3>
                  <table className={TABLE_BASE}>
                    <thead>
                      <tr className={TABLE_HEAD_ROW}>
                        <th className={TABLE_HEAD_CELL}>Project</th>
                        <th className={TABLE_HEAD_CELL}>Ref</th>
                        <th className={TABLE_HEAD_CELL}>Type</th>
                        <th className={TABLE_HEAD_CELL}>Amount</th>
                        <th className={TABLE_HEAD_CELL}>Reason</th>
                        <th className={TABLE_HEAD_CELL}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingQuery.data?.penalties?.map((item) => (
                        <tr key={item.penaltyId} className={TABLE_ROW_BASE}>
                          <td className={TABLE_CELL}>
                            <Link to={`/${tenantSlug}/projects/${item.projectId}`} className="text-[var(--accent)] hover:underline">
                              {item.projectName || 'Untitled Project'}
                            </Link>
                          </td>
                          <td className={TABLE_CELL}>{item.projectRefCode || '—'}</td>
                          <td className={TABLE_CELL}>{item.penaltyType || '—'}</td>
                          <td className={TABLE_CELL}>R{(Number(item.amountCents || 0) / 100).toFixed(2)}</td>
                          <td className={TABLE_CELL}>{item.reason || '—'}</td>
                          <td className={TABLE_CELL}>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                className="!py-1 !px-2 !text-[0.64rem]"
                                onClick={() =>
                                  approvePenaltyMutation.mutate({
                                    projectId: item.projectId,
                                    penaltyId: item.penaltyId,
                                  })
                                }
                                isLoading={approvePenaltyMutation.isPending}
                              >
                                Approve
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                className="!py-1 !px-2 !text-[0.64rem]"
                                onClick={() => {
                                  const reason = window.prompt('Enter rejection reason');
                                  if (!reason || reason.trim().length < 3) return;
                                  rejectPenaltyMutation.mutate({
                                    projectId: item.projectId,
                                    penaltyId: item.penaltyId,
                                    reason: reason.trim(),
                                  });
                                }}
                                isLoading={rejectPenaltyMutation.isPending}
                              >
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {(pendingQuery.data?.interimPaymentCertificates?.length || 0) > 0 ? (
                <div className="mt-6 overflow-x-auto">
                  <h3 className="text-[0.82rem] text-[var(--text-muted)] mb-2">Interim Payment Certificates</h3>
                  <table className={TABLE_BASE}>
                    <thead>
                      <tr className={TABLE_HEAD_ROW}>
                        <th className={TABLE_HEAD_CELL}>Project</th>
                        <th className={TABLE_HEAD_CELL}>Certificate</th>
                        <th className={TABLE_HEAD_CELL}>Billing Period</th>
                        <th className={TABLE_HEAD_CELL}>Amount</th>
                        <th className={TABLE_HEAD_CELL}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingQuery.data?.interimPaymentCertificates?.map((item) => (
                        <tr key={item.certificateId} className={TABLE_ROW_BASE}>
                          <td className={TABLE_CELL}>
                            <Link to={`/${tenantSlug}/projects/${item.projectId}`} className="text-[var(--accent)] hover:underline">
                              {item.projectName || 'Untitled Project'}
                            </Link>
                            <p className="text-[0.65rem] text-[var(--text-muted)]">{item.projectRefCode || '—'}</p>
                          </td>
                          <td className={TABLE_CELL}>{item.certificateNo || item.certificateId}</td>
                          <td className={TABLE_CELL}>{item.billingPeriod || '—'}</td>
                          <td className={TABLE_CELL}>R{(Number(item.amount || 0) / 100).toFixed(2)}</td>
                          <td className={TABLE_CELL}>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                className="!py-1 !px-2 !text-[0.64rem]"
                                onClick={() =>
                                  approveCertificateMutation.mutate({
                                    projectId: item.projectId,
                                    certificateId: item.certificateId,
                                  })
                                }
                                isLoading={approveCertificateMutation.isPending}
                              >
                                Approve
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                className="!py-1 !px-2 !text-[0.64rem]"
                                onClick={() => {
                                  const reason = window.prompt('Enter rejection reason');
                                  if (!reason || reason.trim().length < 3) return;
                                  rejectCertificateMutation.mutate({
                                    projectId: item.projectId,
                                    certificateId: item.certificateId,
                                    reason: reason.trim(),
                                  });
                                }}
                                isLoading={rejectCertificateMutation.isPending}
                              >
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {(pendingQuery.data?.stageApprovals?.length || 0) === 0 &&
              (pendingQuery.data?.stageApprovalItems?.length || 0) === 0 &&
              (pendingQuery.data?.extensionOfTime?.length || 0) === 0 &&
              (pendingQuery.data?.penalties?.length || 0) === 0 &&
              (pendingQuery.data?.interimPaymentCertificates?.length || 0) === 0 ? (
                <EmptyState
                  title="No pending approvals"
                  description="All current approvals are resolved."
                  animationClassName="w-20 h-20"
                  className="py-6"
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
