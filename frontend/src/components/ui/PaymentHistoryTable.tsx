import type { PaymentHistoryEntry, PaymentStatus } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import StatusBadge from '@/components/ui/StatusBadge';
import { Download, Eye } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

type StatusBadgeVariant = 'active' | 'review' | 'danger' | 'planning';

const statusToBadge: Record<PaymentStatus, StatusBadgeVariant> = {
  completed: 'active',
  pending: 'review',
  failed: 'danger',
  processing: 'planning',
};

const statusLabel: Record<PaymentStatus, string> = {
  completed: 'Completed',
  pending: 'Pending',
  failed: 'Failed',
  processing: 'Processing',
};

interface PaymentHistoryTableProps {
  rows: PaymentHistoryEntry[];
  showProjectColumn?: boolean;
  onDownloadInvoice?: (row: PaymentHistoryEntry) => void;
  onViewInvoice?: (row: PaymentHistoryEntry) => void;
}

function isOverdue(dateString: string, status: PaymentStatus): boolean {
  if (status === 'completed') return false;
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const days = diffMs / (1000 * 60 * 60 * 24);
  return days > 30;
}

export default function PaymentHistoryTable({
  rows,
  showProjectColumn = true,
  onDownloadInvoice,
  onViewInvoice,
}: PaymentHistoryTableProps) {
  const totalAmount = rows.reduce((sum, row) => sum + row.paymentAmount, 0);
  const statusCounts: Record<PaymentStatus, number> = {
    completed: 0,
    pending: 0,
    failed: 0,
    processing: 0,
  };
  rows.forEach((row) => {
    statusCounts[row.paymentStatus] += 1;
  });

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr style={{ background: 'var(--table-header-bg)' }}>
            <th className="text-table-header text-left px-4 py-3 whitespace-nowrap">
              Payment Date
            </th>
            <th className="text-table-header text-left px-4 py-3 whitespace-nowrap">
              Invoice Number
            </th>
            <th className="text-table-header text-left px-4 py-3 whitespace-nowrap">
              Consultant Name
            </th>
            <th className="text-table-header text-left px-4 py-3 whitespace-nowrap">
              Payment Amount
            </th>
            <th className="text-table-header text-left px-4 py-3 whitespace-nowrap">
              Payment Status
            </th>
            {showProjectColumn && (
              <th className="text-table-header text-left px-4 py-3 whitespace-nowrap">
                Project
              </th>
            )}
            <th className="text-table-header text-left px-4 py-3 whitespace-nowrap">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={showProjectColumn ? 7 : 6} className="p-0">
                <EmptyState
                  title="No payment records found for this period."
                  className="py-12"
                />
              </td>
            </tr>
          ) : (
            rows.map((row, i) => {
              const overdue = isOverdue(row.paymentDate, row.paymentStatus);

              return (
                <tr
                  key={row.id}
                  className={[
                    'group border-b border-[var(--border)] transition-colors',
                    'hover:bg-[var(--accent-glow)] hover:border-l-2 hover:border-l-[var(--accent)]',
                    i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-card)]',
                  ].join(' ')}
                >
                  <td className="px-4 py-3 text-table-cell">
                    <span
                      className={
                        overdue
                          ? 'text-[0.8rem] font-medium text-[var(--status-danger)]'
                          : undefined
                      }
                    >
                      {formatDate(row.paymentDate)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={onViewInvoice ? () => onViewInvoice(row) : undefined}
                      className="text-mono text-[var(--text-primary)] underline-offset-2 hover:underline"
                    >
                      {row.invoiceNumber}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[0.82rem] font-body font-medium text-[var(--text-primary)]">
                    {row.consultantName}
                  </td>
                  <td className="px-4 py-3 text-currency">
                    {formatCurrency(row.paymentAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={statusToBadge[row.paymentStatus]}>
                      {statusLabel[row.paymentStatus]}
                    </StatusBadge>
                  </td>
                  {showProjectColumn && (
                    <td className="px-4 py-3 text-table-cell">
                      {row.projectName ?? 'N/A'}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={onDownloadInvoice ? () => onDownloadInvoice(row) : undefined}
                        className="inline-flex items-center justify-center h-7 w-7 border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] bg-transparent"
                        aria-label="Download invoice"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={onViewInvoice ? () => onViewInvoice(row) : undefined}
                        className="inline-flex items-center justify-center h-7 w-7 border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] bg-transparent"
                        aria-label="View invoice"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
        {rows.length > 0 && (
          <tfoot>
            <tr className="bg-[var(--bg-secondary)] border-t border-[var(--border-strong)]">
              <td
                className="px-4 py-3 text-[0.75rem] font-semibold text-[var(--accent)]"
                colSpan={3}
              >
                Totals
              </td>
              <td className="px-4 py-3 text-currency font-semibold text-[var(--accent)]">
                {formatCurrency(totalAmount)}
              </td>
              <td className="px-4 py-3 text-[0.7rem] text-[var(--text-secondary)]">
                Completed: {statusCounts.completed} · Pending: {statusCounts.pending} · Failed:{' '}
                {statusCounts.failed} · Processing: {statusCounts.processing}
              </td>
              {showProjectColumn && <td className="px-4 py-3" />}
              <td className="px-4 py-3" />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

