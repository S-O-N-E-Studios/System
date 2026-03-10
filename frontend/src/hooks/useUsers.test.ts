import { describe, it, expect, vi } from 'vitest';

vi.mock('@/api/users', () => ({
  usersApi: {
    list: vi.fn(),
    invite: vi.fn(),
    updateRole: vi.fn(),
    suspend: vi.fn(),
    reactivate: vi.fn(),
  },
}));

import { useUsers, useInviteUser, useUpdateUserRole, useSuspendUser, useReactivateUser } from './useUsers';

describe('useUsers hooks', () => {
  it('exports all expected hooks', () => {
    expect(typeof useUsers).toBe('function');
    expect(typeof useInviteUser).toBe('function');
    expect(typeof useUpdateUserRole).toBe('function');
    expect(typeof useSuspendUser).toBe('function');
    expect(typeof useReactivateUser).toBe('function');
  });
});
