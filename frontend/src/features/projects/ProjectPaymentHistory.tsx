import { useState, useEffect, useCallback, useMemo } from 'react';
import { paymentsApi } from '@/api/payments';
import { projectsApi } from '@/api/projects';
import type { PaymentHistoryEntry, PaymentStatus } from '@/types';
import PaymentHistoryTable from '@/components/ui/PaymentHistoryTable';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatCurrency } from '@/utils/formatters';
import { Search, Filter, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useUiStore } from '@/store/uiStore';

interface ProjectPaymentHistoryProps {
  projectId: string;
  onPaymentRecorded?: () => Promise<void> | void;
}

const STATUS_OPTIONS: { value: '' | PaymentStatus; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'failed', label: 'Failed' },
];

export default function ProjectPaymentHistory({ projectId, onPaymentRecorded }: ProjectPaymentHistoryProps) {
  const { addToast } = useUiStore();
  const [entries, setEntries] = useState<PaymentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [amountRands, setAmountRands] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [contractType, setContractType] = useState<'professional' | 'geotechnical' | 'construction'>('construction');
  const [description, setDescription] = useState('');
  const [certificateNo, setCertificateNo] = useState('');

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | PaymentStatus>('');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentsApi.listPaymentHistory({
        projectId,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        status: statusFilter || undefined,
        pageSize: 100,
      });
      setEntries(res.data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, dateFrom, dateTo, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    fetchPayments().then(() => {
      if (cancelled) return;
    });
    return () => { cancelled = true; };
  }, [fetchPayments]);

  const filteredEntries = useMemo(() => {
    let result = entries;
    if (statusFilter) {
      result = result.filter((e) => e.paymentStatus === statusFilter);
    }
    if (dateFrom) {
      result = result.filter((e) => e.paymentDate >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((e) => e.paymentDate <= dateTo);
    }
    return result;
  }, [entries, statusFilter, dateFrom, dateTo]);

  const summary = useMemo(() => {
    const totalPaid = filteredEntries
      .filter((e) => e.paymentStatus === 'completed')
      .reduce((s, e) => s + e.paymentAmount, 0);
    const totalPending = filteredEntries
      .filter((e) => e.paymentStatus === 'pending' || e.paymentStatus === 'processing')
      .reduce((s, e) => s + e.paymentAmount, 0);
    const totalFailed = filteredEntries
      .filter((e) => e.paymentStatus === 'failed')
      .reduce((s, e) => s + e.paymentAmount, 0);
    const totalAll = filteredEntries.reduce((s, e) => s + e.paymentAmount, 0);
    return { totalPaid, totalPending, totalFailed, totalAll, count: filteredEntries.length };
  }, [filteredEntries]);

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setStatusFilter('');
  };

  const hasFilters = dateFrom || dateTo || statusFilter;

  const recordExpenditure = async () => {
    const parsed = Number(amountRands);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      addToast({ type: 'error', message: 'Enter a valid expenditure amount.' });
      return;
    }
    if (!paymentDate) {
      addToast({ type: 'error', message: 'Payment date is required.' });
      return;
    }
    setIsRecording(true);
    try {
      await projectsApi.addPayment(projectId, {
        amount: Math.round(parsed * 100),
        paymentDate: new Date(paymentDate).toISOString(),
        description: description || undefined,
        certificateNo: certificateNo || undefined,
        contractType,
      });
      addToast({ type: 'success', message: 'Expenditure recorded.' });
      setAmountRands('');
      setDescription('');
      setCertificateNo('');
      await fetchPayments();
      await onPaymentRecorded?.();
    } catch {
      addToast({ type: 'error', message: 'Could not record expenditure.' });
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4">
        <h4 className="text-h3 text-[0.95rem] mb-3">Record Expenditure</h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="number"
            min="0"
            step="0.01"
            value={amountRands}
            onChange={(e) => setAmountRands(e.target.value)}
            placeholder="Amount (ZAR)"
            className="h-9 px-3 text-[0.82rem] bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none transition-colors"
          />
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="h-9 px-3 text-[0.82rem] bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none transition-colors"
          />
          <select
            value={contractType}
            onChange={(e) => setContractType(e.target.value as 'professional' | 'geotechnical' | 'construction')}
            className="h-9 px-3 text-[0.82rem] bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none transition-colors"
          >
            <option value="professional">Professional</option>
            <option value="geotechnical">Geotechnical</option>
            <option value="construction">Construction</option>
          </select>
          <input
            value={certificateNo}
            onChange={(e) => setCertificateNo(e.target.value)}
            placeholder="Certificate / Invoice No"
            className="h-9 px-3 text-[0.82rem] bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none transition-colors"
          />
          <Button variant="primary" onClick={() => void recordExpenditure()} isLoading={isRecording}>
            Save
          </Button>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="mt-3 w-full min-h-[70px] px-3 py-2 text-[0.82rem] bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none transition-colors"
        />
      </div>

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
              onClick={() => fetchPayments()}
              className="h-9 px-4 text-[0.75rem] font-semibold uppercase tracking-wider border border-[var(--accent-dim)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors flex items-center gap-1.5"
            >
              <Search className="h-3.5 w-3.5" />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Payment Table */}
      {loading ? (
        <div className="min-h-[280px] relative">
          <LoadingOverlay fullscreen={false} />
        </div>
      ) : (
        <PaymentHistoryTable rows={filteredEntries} showProjectColumn={false} />
      )}
    </div>
  );
}
