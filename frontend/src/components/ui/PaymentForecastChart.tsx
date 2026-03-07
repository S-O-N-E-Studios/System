import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatRands } from '@/utils/formatters';

interface SeriesPoint {
  month: string;
  amount: number;
}

export interface PaymentForecastChartProps {
  forecastData: SeriesPoint[];
  actualData: SeriesPoint[];
  currency?: string;
  title?: string;
  height?: number;
}

function buildChartData(forecastData: SeriesPoint[], actualData: SeriesPoint[]) {
  const byMonth = new Map<string, { month: string; expected?: number; actual?: number }>();

  forecastData.forEach((p) => {
    const existing = byMonth.get(p.month) ?? { month: p.month };
    existing.expected = p.amount;
    byMonth.set(p.month, existing);
  });

  actualData.forEach((p) => {
    const existing = byMonth.get(p.month) ?? { month: p.month };
    existing.actual = p.amount;
    byMonth.set(p.month, existing);
  });

  return Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month));
}

function formatAxis(value: number): string {
  if (value >= 1_000_000) return `R ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R ${(value / 1_000).toFixed(0)}k`;
  return `R ${value}`;
}

function PaymentTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;

  const expected = payload.find((p) => p.name === 'Expected Payments');
  const actual = payload.find((p) => p.name === 'Actual Payments');

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-strong)] px-4 py-3 shadow-lg min-w-[200px]">
      <p className="text-eyebrow mb-2">{label}</p>
      {expected && (
        <p className="text-[0.8rem] text-[var(--text-secondary)] mb-1">
          Expected:{' '}
          <span className="text-currency">{formatRands(expected.value)}</span>
        </p>
      )}
      {actual && (
        <p className="text-[0.8rem] text-[var(--text-secondary)]">
          Actual:{' '}
          <span
            className="text-currency"
            style={{ color: 'var(--teal-accent)' }}
          >
            {formatRands(actual.value)}
          </span>
        </p>
      )}
    </div>
  );
}

export default function PaymentForecastChart({
  forecastData,
  actualData,
  title = 'Expected vs Actual Payments',
  height = 280,
}: PaymentForecastChartProps) {
  const data = buildChartData(forecastData, actualData);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)]">
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <h3 className="text-h3">{title}</h3>
      </div>
      <div className="px-4 pb-4 pt-2">
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                tickFormatter={formatAxis}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={{ stroke: 'var(--border)' }}
              />
              <Tooltip content={<PaymentTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '0.7rem' }}
                formatter={(value) => (
                  <span style={{ color: 'var(--text-secondary)' }}>{value}</span>
                )}
                iconType="line"
                iconSize={12}
              />
              <Line
                type="monotone"
                dataKey="expected"
                name="Expected Payments"
                stroke="var(--accent)"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={{ r: 4, stroke: 'var(--accent)', fill: 'var(--bg-card)', strokeWidth: 2 }}
                activeDot={{ r: 5, stroke: 'var(--accent)', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual Payments"
                stroke="var(--teal-accent)"
                strokeWidth={2}
                dot={{ r: 4, stroke: 'var(--teal-accent)', fill: 'var(--bg-card)', strokeWidth: 2 }}
                activeDot={{ r: 5, stroke: 'var(--teal-accent)', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

