import { useEffect, useState } from 'react';
import PaymentForecastChart, {
  type PaymentForecastChartProps,
} from '@/components/ui/PaymentForecastChart';
import EmptyState from '@/components/ui/EmptyState';
import { fetchPaymentForecastReport } from '@/api/reports';

type SeriesPoint = PaymentForecastChartProps['forecastData'][number];

/** Backend: GET /:tenant/reports/payment-forecast → { forecastByMonth, paymentsByMonth } */
function normalizeReportPayload(raw: Record<string, unknown>): {
  forecast: SeriesPoint[];
  actual: SeriesPoint[];
} {
  const forecastRows = Array.isArray(raw.forecastByMonth) ? raw.forecastByMonth : [];
  const paymentRows = Array.isArray(raw.paymentsByMonth) ? raw.paymentsByMonth : [];

  const forecastTotals = new Map<string, number>();
  for (const row of forecastRows) {
    const r = row as { _id?: { month?: string }; forecastAmount?: number };
    const key = r._id?.month;
    if (!key) continue;
    forecastTotals.set(key, (forecastTotals.get(key) ?? 0) + Number(r.forecastAmount ?? 0));
  }

  const actualTotals = new Map<string, number>();
  for (const row of paymentRows) {
    const r = row as { _id?: { month?: string }; paidAmount?: number };
    const key = r._id?.month;
    if (!key) continue;
    actualTotals.set(key, (actualTotals.get(key) ?? 0) + Number(r.paidAmount ?? 0));
  }

  if (actualTotals.size === 0) {
    for (const row of forecastRows) {
      const r = row as { _id?: { month?: string }; actualAmount?: number };
      const key = r._id?.month;
      if (!key) continue;
      actualTotals.set(key, (actualTotals.get(key) ?? 0) + Number(r.actualAmount ?? 0));
    }
  }

  const allKeys = new Set([...forecastTotals.keys(), ...actualTotals.keys()]);
  const sorted = [...allKeys].sort();

  const forecast: SeriesPoint[] = sorted.map((key) => ({
    month: key,
    amount: forecastTotals.get(key) ?? 0,
  }));
  const actual: SeriesPoint[] = sorted.map((key) => ({
    month: key,
    amount: actualTotals.get(key) ?? 0,
  }));

  return { forecast, actual };
}

export default function PaymentForecast() {
  const [forecast, setForecast] = useState<SeriesPoint[]>([]);
  const [actual, setActual] = useState<SeriesPoint[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPaymentForecastReport()
      .then((data) => {
        if (cancelled || !data || typeof data !== 'object') return;
        const { forecast: f, actual: a } = normalizeReportPayload(data as Record<string, unknown>);
        setForecast(f);
        setActual(a);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasData = forecast.some((p) => p.amount > 0) || actual.some((p) => p.amount > 0);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-h2 mb-2">Expected vs Actual Payments</h2>
        <p className="text-body">
          Compare projected costs with recorded payments over the year. Use this to track deviations and align spending with forecasts.
        </p>
      </div>

      {!loaded ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 text-[0.82rem] text-[var(--text-muted)]">
          Loading…
        </div>
      ) : hasData ? (
        <PaymentForecastChart forecastData={forecast} actualData={actual} />
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border)]">
          <EmptyState
            title="No payment forecast data yet."
            description="Forecasts and payments will appear here once they are recorded for your organisation."
          />
        </div>
      )}
    </div>
  );
}
