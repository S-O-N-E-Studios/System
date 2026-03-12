import PaymentForecastChart from '@/components/ui/PaymentForecastChart';
import EmptyState from '@/components/ui/EmptyState';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { usePaymentForecast } from '@/hooks/usePayments';

export default function PaymentForecast() {
  const { data, isLoading, error } = usePaymentForecast();

  if (isLoading) {
    return (
      <div className="min-h-[280px] relative">
        <LoadingOverlay fullscreen={false} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-[0.82rem] text-[var(--status-danger)]">
          Failed to load forecast data.
        </p>
      </div>
    );
  }

  const forecast = data?.forecast ?? [];
  const actual = data?.actual ?? [];
  const hasData = forecast.length > 0 || actual.length > 0;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-h2 mb-2">Expected vs Actual Payments</h2>
        <p className="text-body">
          Compare projected costs with recorded payments over the year. Use this to track deviations and align spending with forecasts.
        </p>
      </div>

      {hasData ? (
        <PaymentForecastChart forecastData={forecast} actualData={actual} />
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border)]">
          <EmptyState
            title="No payment forecast data yet."
            description="Data will appear here once payments and forecasts are recorded."
          />
        </div>
      )}
    </div>
  );
}
