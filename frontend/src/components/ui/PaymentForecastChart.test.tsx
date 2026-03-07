import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import PaymentForecastChart from './PaymentForecastChart';

describe('PaymentForecastChart', () => {
  it('renders chart title', () => {
    const forecast = [
      { month: 'Jan', amount: 1_000_000 },
      { month: 'Feb', amount: 2_000_000 },
    ];
    const actual = [
      { month: 'Jan', amount: 900_000 },
      { month: 'Feb', amount: 1_800_000 },
    ];

    render(
      <PaymentForecastChart
        title="Expected vs Actual Payments"
        forecastData={forecast}
        actualData={actual}
      />
    );

    expect(screen.getByText(/expected vs actual payments/i)).toBeInTheDocument();
  });
});

