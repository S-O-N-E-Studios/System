import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { Grant, GrantStatus } from '@/types';
import { fetchGrants, fetchGrantsSummary } from '@/api/grants';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { formatRands } from '@/utils/formatters';
import { exportPdf, exportXlsx } from '@/utils/clientExports';
import { useUiStore } from '@/store/uiStore';
import ExportDialog, { type ExportFormat } from '@/components/ui/ExportDialog';
import { Download } from 'lucide-react';

const STATUS_LABELS: Record<GrantStatus, string> = {
  active: 'Active',
  closed: 'Closed',
  pending: 'Pending',
};

export default function Grants() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [filterStatus, setFilterStatus] = useState<GrantStatus | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const { addToast } = useUiStore();

  const {
    data: grants = [],
    isLoading: grantsLoading,
    isError: grantsError,
  } = useQuery({
    queryKey: ['grants', 'list', tenantSlug, filterStatus],
    queryFn: () => fetchGrants({ status: filterStatus ?? undefined }),
  });

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
  } = useQuery({
    queryKey: ['grants', 'summary', tenantSlug],
    queryFn: fetchGrantsSummary,
  });

  const isLoading = grantsLoading || summaryLoading;
  const error = grantsError || summaryError;

  const handleStatusChange = (value: string) => {
    setFilterStatus(value ? (value as GrantStatus) : null);
  };

  type GrantRow = {
    grantName: string;
    grantType: string;
    funderOrg: string;
    financialYear: string;
    totalValue: string;
    disbursedToDate: string;
    remaining: string;
    status: string;
  };

  const handleExport = async (format: ExportFormat) => {
    if (format === 'both') {
      await handleExport('pdf');
      await handleExport('xlsx');
      return;
    }
    if (grants.length === 0) {
      addToast({ type: 'warning', message: 'No grants to export for the current filter.' });
      return;
    }
    const rows: GrantRow[] = grants.map((g) => ({
      grantName: g.grantName,
      grantType: g.grantType.toUpperCase(),
      funderOrg: g.funderOrg,
      financialYear: g.financialYear,
      totalValue: formatRands(g.totalValue),
      disbursedToDate: formatRands(g.disbursedToDate),
      remaining: formatRands(g.remaining),
      status: STATUS_LABELS[g.status],
    }));
    const columns: { key: keyof GrantRow; header: string }[] = [
      { key: 'grantName', header: 'Grant' },
      { key: 'grantType', header: 'Type' },
      { key: 'funderOrg', header: 'Funder' },
      { key: 'financialYear', header: 'Year' },
      { key: 'totalValue', header: 'Total' },
      { key: 'disbursedToDate', header: 'Disbursed' },
      { key: 'remaining', header: 'Remaining' },
      { key: 'status', header: 'Status' },
    ];
    const filterNote =
      filterStatus != null ? `Status: ${STATUS_LABELS[filterStatus]}` : 'All statuses';
    const filename = `Grants-${tenantSlug ?? 'tenant'}.${format === 'xlsx' ? 'xlsx' : 'pdf'}`;
    if (format === 'xlsx') {
      await exportXlsx<GrantRow>({
        filename,
        sheetName: 'Grants',
        columns,
        rows,
      });
    } else {
      exportPdf<GrantRow>({
        filename,
        title: 'Grants tracking',
        subtitle: filterNote,
        columns,
        rows,
      });
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-h1 mb-8">Grants Tracking</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <GrantStatCard
          label="Total Grants"
          value={summary ? formatRands(summary.totalValue) : '—'}
        />
        <GrantStatCard
          label="Disbursed to Date"
          value={summary ? formatRands(summary.disbursedToDate) : '—'}
        />
        <GrantStatCard
          label="Remaining"
          value={summary ? formatRands(summary.remaining) : '—'}
        />
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] mb-4 px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <label className="text-[0.7rem] text-[var(--text-muted)]">
            Status:
            <select
              value={filterStatus ?? ''}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="ml-2 bg-[var(--bg-surface-alt)] border border-[var(--border-default)] text-[var(--text-primary)] text-[0.8rem] px-3 py-2"
            >
              <option value="">All</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="secondary" onClick={() => setExportOpen(true)}>
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)]">
        {isLoading ? (
          <LoadingState
            title="Loading grants"
            description="Fetching grant allocation and compliance data."
          />
        ) : error ? (
          <ErrorState title="Unable to load grants" description="Please try again later." />
        ) : grants.length === 0 ? (
          <EmptyState
            title="No grants captured yet."
            description="Once grants are configured for this tenant, they will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-[0.8rem]">
              <thead className="bg-[var(--bg-surface-alt)] border-b border-[var(--border-default)]">
                <tr>
                  <th className="px-4 py-3 font-medium text-[var(--text-muted)]">Grant</th>
                  <th className="px-4 py-3 font-medium text-[var(--text-muted)]">Funder</th>
                  <th className="px-4 py-3 font-medium text-[var(--text-muted)]">Year</th>
                  <th className="px-4 py-3 font-medium text-[var(--text-muted)]">Total</th>
                  <th className="px-4 py-3 font-medium text-[var(--text-muted)]">Disbursed</th>
                  <th className="px-4 py-3 font-medium text-[var(--text-muted)]">Remaining</th>
                  <th className="px-4 py-3 font-medium text-[var(--text-muted)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {grants.map((grant: Grant) => (
                  <tr
                    key={grant.id}
                    className="border-t border-[var(--border-default)] hover:bg-[var(--accent-sand-glow)] transition-colors"
                  >
                    <td className="px-4 py-3 text-[var(--text-primary)]">
                      <div className="flex flex-col">
                        <span>{grant.grantName}</span>
                        <span className="text-[0.7rem] text-[var(--text-muted)]">
                          {grant.grantType.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-primary)]">{grant.funderOrg}</td>
                    <td className="px-4 py-3 text-[var(--text-primary)]">{grant.financialYear}</td>
                    <td className="px-4 py-3 text-financial">{formatRands(grant.totalValue)}</td>
                    <td className="px-4 py-3 text-financial">
                      {formatRands(grant.disbursedToDate)}
                    </td>
                    <td className="px-4 py-3 text-financial">{formatRands(grant.remaining)}</td>
                    <td className="px-4 py-3 text-[var(--text-primary)]">
                      <span className="px-2 py-1 text-[0.7rem] border border-[var(--border-default)] bg-[var(--bg-surface-alt)]">
                        {STATUS_LABELS[grant.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ExportDialog
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        context="Grants"
        onExport={handleExport}
      />
    </div>
  );
}

interface GrantStatCardProps {
  label: string;
  value: string;
}

function GrantStatCard({ label, value }: GrantStatCardProps) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] px-5 py-4 flex flex-col gap-1">
      <span className="text-[0.7rem] text-[var(--text-muted)] uppercase tracking-wide">
        {label}
      </span>
      <span className="text-financial text-[1rem]">{value}</span>
    </div>
  );
}
