import { describe, it, expect, vi } from 'vitest';

vi.mock('@/api/tenants', () => ({
  tenantsApi: {
    list: vi.fn(),
    getById: vi.fn(),
    suspend: vi.fn(),
    reactivate: vi.fn(),
  },
}));

import { useTenants, useTenant, useSuspendTenant, useReactivateTenant } from './useTenants';

describe('useTenants hooks', () => {
  it('exports all expected hooks', () => {
    expect(typeof useTenants).toBe('function');
    expect(typeof useTenant).toBe('function');
    expect(typeof useSuspendTenant).toBe('function');
    expect(typeof useReactivateTenant).toBe('function');
  });
});
