import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';
import type { Permission } from './permissions';
import { canForRole } from './permissions';

/**
 * Central RBAC helper.
 *
 * Returns a memoized predicate so components can use it in filters without
 * creating lots of extra derived state.
 */
export function useCan() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { user } = useAuthStore();

  const tenantRole: UserRole | undefined = useMemo(() => {
    if (!user) return undefined;
    if (user.role === 'SUPER_ADMIN') return user.role;
    if (!tenantSlug) return user.role;
    return user.tenants.find((t) => t.slug === tenantSlug)?.role ?? user.role;
  }, [user, tenantSlug]);

  return (permission: Permission) => canForRole(tenantRole, permission);
}

