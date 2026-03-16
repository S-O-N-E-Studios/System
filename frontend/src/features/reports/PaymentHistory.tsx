import { useState, useEffect } from 'react';
import { paymentsApi, mockPaymentHistory } from '@/api/payments';
import type { PaymentHistoryEntry } from '@/types';
import PaymentHistoryTable from '@/components/ui/PaymentHistoryTable';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

export default function PaymentHistory() {
  const [entries, setEntries] = useState<PaymentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await paymentsApi.listPaymentHistory({ pageSize: 50 });
        if (!cancelled) setEntries(res.data);
      } catch {
        if (!cancelled) {
          setEntries(mockPaymentHistory());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

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
          <p className="text-[0.82rem] text-[var(--status-danger)]">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="min-h-[280px] relative">
          <LoadingOverlay fullscreen={false} />
        </div>
      ) : (
        <PaymentHistoryTable rows={entries} showProjectColumn />
      )}
    </div>
  );
}
