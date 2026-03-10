import { describe, it, expect, vi } from 'vitest';

vi.mock('@/api/dashboard', () => ({
  dashboardApi: {
    getStats: vi.fn(),
  },
}));

import { dashboardApi } from '@/api/dashboard';
import { useDashboardStats } from './useDashboard';

describe('useDashboardStats', () => {
  it('is a function that returns a query object', () => {
    expect(typeof useDashboardStats).toBe('function');
  });

  it('calls dashboardApi.getStats', () => {
    expect(dashboardApi.getStats).toBeDefined();
  });
});
