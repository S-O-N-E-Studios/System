import { describe, it, expect, vi } from 'vitest';

vi.mock('@/api/payments', () => ({
  paymentsApi: {
    listPaymentHistory: vi.fn(),
    getForecast: vi.fn(),
  },
}));

import { usePaymentHistory, usePaymentForecast } from './usePayments';

describe('usePayments hooks', () => {
  it('exports all expected hooks', () => {
    expect(typeof usePaymentHistory).toBe('function');
    expect(typeof usePaymentForecast).toBe('function');
  });
});
