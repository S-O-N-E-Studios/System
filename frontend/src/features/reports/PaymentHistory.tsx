import { usePaymentHistory } from '@/hooks/usePayments';
import PaymentHistoryTable from '@/components/ui/PaymentHistoryTable';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

export default function PaymentHistory() {
  const { data, isLoading, error } = usePaymentHistory({ pageSize: 50 });
  const entries = data?.data ?? [];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-h2 mb-2">Payment History</h2>
        <p className="text-body">
          Recorded payments with consultant, invoice, date, amount and status for tracking and auditing.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 border border-[var(--status-danger)] bg-[rgba(248,113,113,0.05)]">
          <p className="text-[0.82rem] text-[var(--status-danger)]">
            Failed to load payment history. Please try again later.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="min-h-[280px] relative">
          <LoadingOverlay fullscreen={false} />
        </div>
      ) : (
        <PaymentHistoryTable rows={entries} showProjectColumn />
      )}
    </div>
  );
}
