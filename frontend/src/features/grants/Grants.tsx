import { useEffect, useState } from 'react';
import { useGrantsStore } from '@/store/grantsStore';
import type { Grant, GrantStatus } from '@/types';
import { fetchGrants, fetchGrantsSummary } from '@/api/grants';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { formatRands } from '@/utils/formatters';

const STATUS_LABELS: Record<GrantStatus, string> = {
  active: 'Active',
  closed: 'Closed',
  pending: 'Pending',
};

export default function Grants() {
  const { grants, filterStatus, isLoading, setGrants, setFilterStatus, setLoading } =
    useGrantsStore();
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof fetchGrantsSummary>> | null>(
    null
  );

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [grantsData, summaryData] = await Promise.all([
          fetchGrants({ status: filterStatus }),
          fetchGrantsSummary(),
        ]);

        if (!isMounted) return;

        setGrants(grantsData);
        setSummary(summaryData);
      } catch {
        if (!isMounted) return;
        setError('Failed to load grants data.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [filterStatus, setGrants, setLoading]);

  const handleStatusChange = (value: string) => {
    setFilterStatus(value ? (value as GrantStatus) : null);
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-h1 mb-8">Grants Tracking</h1>

      {/* Summary row */}
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

      {/* Toolbar */}
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
          <Button type="button" variant="secondary">
            Export PDF
          </Button>
          <Button type="button" variant="secondary">
            Export XLSX
          </Button>
        </div>
      </div>

      {/* Grants table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)]">
        {isLoading ? (
          <LoadingState
            title="Loading grants"
            description="Fetching grant allocation and compliance data."
          />
        ) : error ? (
          <ErrorState
            title="Unable to load grants"
            description="Please try again later."
          />
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

