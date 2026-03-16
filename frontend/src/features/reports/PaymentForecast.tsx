import PaymentForecastChart, {
  type PaymentForecastChartProps,
} from '@/components/ui/PaymentForecastChart';
import EmptyState from '@/components/ui/EmptyState';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Mock data: expected vs actual payments, in rands per month */
function mockForecastData(): {
  forecast: PaymentForecastChartProps['forecastData'];
  actual: PaymentForecastChartProps['actualData'];
} {
  const expectedPerMonth = 6_200_000;
  const forecast = MONTHS.map((month) => ({
    month,
    amount: expectedPerMonth,
  }));

  const actual = MONTHS.map((month, i) => {
    const variance = 0.82 + (i % 5) * 0.04;
    return {
      month,
      amount: Math.round(expectedPerMonth * variance),
    };
  });

  return { forecast, actual };
}

export default function PaymentForecast() {
  const { forecast, actual } = mockForecastData();
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
