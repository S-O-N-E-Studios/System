import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import PaymentForecastChart from './PaymentForecastChart';
import { buildChartData, formatAxis } from '@/utils/chartHelpers';

const forecast = [
  { month: 'Jan', amount: 1_000_000 },
  { month: 'Feb', amount: 2_000_000 },
  { month: 'Mar', amount: 3_000_000 },
];
const actual = [
  { month: 'Jan', amount: 900_000 },
  { month: 'Feb', amount: 1_800_000 },
];

describe('PaymentForecastChart', () => {
  it('renders chart title', () => {
    render(<PaymentForecastChart forecastData={forecast} actualData={actual} />);
    expect(screen.getByText(/expected vs actual payments/i)).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(
      <PaymentForecastChart
        forecastData={forecast}
        actualData={actual}
        title="Custom Title"
      />
    );
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('renders with empty forecast and actual data', () => {
    render(<PaymentForecastChart forecastData={[]} actualData={[]} />);
    expect(screen.getByText(/expected vs actual payments/i)).toBeInTheDocument();
  });

  it('renders with only forecast data', () => {
    render(<PaymentForecastChart forecastData={forecast} actualData={[]} />);
    expect(screen.getByText(/expected vs actual payments/i)).toBeInTheDocument();
  });

  it('renders with only actual data', () => {
    render(<PaymentForecastChart forecastData={[]} actualData={actual} />);
    expect(screen.getByText(/expected vs actual payments/i)).toBeInTheDocument();
  });
});

describe('buildChartData', () => {
  it('merges forecast and actual into single dataset', () => {
    const result = buildChartData(
      [{ month: 'Jan', amount: 100 }],
      [{ month: 'Jan', amount: 80 }]
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ month: 'Jan', expected: 100, actual: 80 });
  });

  it('handles months only in forecast', () => {
    const result = buildChartData(
      [{ month: 'Jan', amount: 100 }],
      []
    );
    expect(result).toHaveLength(1);
    expect(result[0].expected).toBe(100);
    expect(result[0].actual).toBeUndefined();
  });

  it('handles months only in actual', () => {
    const result = buildChartData(
      [],
      [{ month: 'Feb', amount: 80 }]
    );
    expect(result).toHaveLength(1);
    expect(result[0].expected).toBeUndefined();
    expect(result[0].actual).toBe(80);
  });

  it('handles non-overlapping months', () => {
    const result = buildChartData(
      [{ month: 'Jan', amount: 100 }],
      [{ month: 'Feb', amount: 200 }]
    );
    expect(result).toHaveLength(2);
  });

  it('sorts by month name', () => {
    const result = buildChartData(
      [{ month: 'Mar', amount: 300 }, { month: 'Jan', amount: 100 }],
      [{ month: 'Feb', amount: 200 }]
    );
    expect(result.map((r) => r.month)).toEqual(['Feb', 'Jan', 'Mar']);
  });

  it('returns empty array for no data', () => {
    expect(buildChartData([], [])).toEqual([]);
  });
});

describe('formatAxis', () => {
  it('formats millions', () => {
    expect(formatAxis(1_500_000)).toBe('R 1.5M');
  });

  it('formats exactly 1 million', () => {
    expect(formatAxis(1_000_000)).toBe('R 1.0M');
  });

  it('formats thousands', () => {
    expect(formatAxis(5_000)).toBe('R 5k');
  });

  it('formats exactly 1 thousand', () => {
    expect(formatAxis(1_000)).toBe('R 1k');
  });

  it('formats small values', () => {
    expect(formatAxis(500)).toBe('R 500');
  });

  it('formats zero', () => {
    expect(formatAxis(0)).toBe('R 0');
  });
});
