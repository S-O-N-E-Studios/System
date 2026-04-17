import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import apiClient from '@/api/client';
import LoadingState from '@/components/ui/LoadingState';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import Button from '@/components/ui/Button';
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

export default function Approvals() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  const pendingQuery = useQuery({
    queryKey: ['approvals-pending-summary', tenantSlug],
    queryFn: async () => {
      const res = await apiClient.get(`/${tenantSlug}/approvals/pending-summary`);
      const body = res.data?.data || res.data;
      return (body?.items || []) as PendingApprovalSummary[];
    },
    enabled: Boolean(tenantSlug),
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
          ) : pendingQuery.data?.length ? (
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
                  {pendingQuery.data.map((item) => (
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
          ) : (
            <EmptyState
              title="No pending approvals"
              description="All current approvals are resolved."
              animationClassName="w-20 h-20"
              className="py-6"
            />
          )}
        </div>
      </div>
    </div>
  );
}
