import { useState, useMemo } from 'react';
import { usePaymentHistory } from '@/hooks/usePayments';
import type { PaymentStatus } from '@/types';
import PaymentHistoryTable from '@/components/ui/PaymentHistoryTable';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatCurrency } from '@/utils/formatters';
import { Search, Filter, RefreshCw } from 'lucide-react';

interface ProjectPaymentHistoryProps {
  projectId: string;
}

const STATUS_OPTIONS: { value: '' | PaymentStatus; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'failed', label: 'Failed' },
];

export default function ProjectPaymentHistory({ projectId }: ProjectPaymentHistoryProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | PaymentStatus>('');

  const queryParams = useMemo(() => ({
    projectId,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    status: statusFilter || undefined,
    pageSize: 100,
  }), [projectId, dateFrom, dateTo, statusFilter]);

  const { data, isLoading, error, refetch } = usePaymentHistory(queryParams);
  const entries = data?.data ?? [];

  const summary = useMemo(() => {
    const totalPaid = entries
      .filter((e) => e.paymentStatus === 'completed')
      .reduce((s, e) => s + e.paymentAmount, 0);
    const totalPending = entries
      .filter((e) => e.paymentStatus === 'pending' || e.paymentStatus === 'processing')
      .reduce((s, e) => s + e.paymentAmount, 0);
    const totalFailed = entries
      .filter((e) => e.paymentStatus === 'failed')
      .reduce((s, e) => s + e.paymentAmount, 0);
    const totalAll = entries.reduce((s, e) => s + e.paymentAmount, 0);
    return { totalPaid, totalPending, totalFailed, totalAll, count: entries.length };
  }, [entries]);

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setStatusFilter('');
  };

  const hasFilters = dateFrom || dateTo || statusFilter;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-0">
        <div className="p-5 border border-[var(--border)] bg-[var(--bg-card)]">
          <p className="text-eyebrow mb-2">Total Expenditure</p>
          <p className="text-stat">{formatCurrency(summary.totalAll)}</p>
          <p className="text-[0.65rem] text-[var(--text-muted)] mt-1">
            {summary.count} invoice{summary.count !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="p-5 border border-[var(--border)] bg-[var(--bg-card)]">
          <p className="text-eyebrow mb-2">Paid</p>
          <p className="font-display text-[1.2rem] font-semibold text-[var(--status-active)]">
            {formatCurrency(summary.totalPaid)}
          </p>
          <StatusBadge status="active">Completed</StatusBadge>
        </div>
        <div className="p-5 border border-[var(--border)] bg-[var(--bg-card)]">
          <p className="text-eyebrow mb-2">Pending / Processing</p>
          <p className="font-display text-[1.2rem] font-semibold text-[var(--status-review)]">
            {formatCurrency(summary.totalPending)}
          </p>
          <StatusBadge status="review">Awaiting</StatusBadge>
        </div>
        <div className="p-5 border border-[var(--border)] bg-[var(--bg-card)]">
          <p className="text-eyebrow mb-2">Failed</p>
          <p className="font-display text-[1.2rem] font-semibold text-[var(--status-danger)]">
            {formatCurrency(summary.totalFailed)}
          </p>
          <StatusBadge status="danger">Failed</StatusBadge>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 px-3 text-[0.82rem] bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 px-3 text-[0.82rem] bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Status
            </label>
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)] pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as '' | PaymentStatus)}
                className="h-9 pl-8 pr-6 text-[0.82rem] bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none transition-colors appearance-none cursor-pointer"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {hasFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="h-9 px-3 text-[0.75rem] font-semibold uppercase tracking-wider border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="h-3 w-3" />
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => refetch()}
              className="h-9 px-4 text-[0.75rem] font-semibold uppercase tracking-wider border border-[var(--accent-dim)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors flex items-center gap-1.5"
            >
              <Search className="h-3.5 w-3.5" />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 border border-[var(--status-danger)] bg-[rgba(248,113,113,0.05)]">
          <p className="text-[0.82rem] text-[var(--status-danger)]">
            Failed to load payment history. Please try again later.
          </p>
        </div>
      )}

      {/* Payment Table */}
      {isLoading ? (
        <div className="min-h-[280px] relative">
          <LoadingOverlay fullscreen={false} />
        </div>
      ) : (
        <PaymentHistoryTable rows={entries} showProjectColumn={false} />
      )}
    </div>
  );
}
