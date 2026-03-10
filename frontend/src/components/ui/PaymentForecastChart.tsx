import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatRands } from '@/utils/formatters';
import { buildChartData, formatAxis } from '@/utils/chartHelpers';

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
  height = 360,
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
            <BarChart
              data={data}
              margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
              barGap={4}
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
              <Tooltip content={<PaymentTooltip />} cursor={{ fill: 'var(--bg-secondary)', opacity: 0.4 }} />
              <Legend
                wrapperStyle={{ fontSize: '0.7rem' }}
                formatter={(value) => (
                  <span style={{ color: 'var(--text-secondary)' }}>{value}</span>
                )}
                iconType="rect"
                iconSize={10}
              />
              <Bar
                dataKey="expected"
                name="Expected Payments"
                fill="var(--accent)"
                radius={[2, 2, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="actual"
                name="Actual Payments"
                fill="var(--teal-accent)"
                radius={[2, 2, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

