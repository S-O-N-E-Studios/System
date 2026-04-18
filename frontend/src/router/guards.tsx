import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTenantStore } from '@/store/tenantStore';
import { useEffect, useState } from 'react';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import type { OrgType, TenantSummary } from '@/types';
import { clientAccessCheck } from '@/api/clientAccess';
import { useClientAccessStore } from '@/store/clientAccessStore';
import { organizationApi } from '@/api/organization';
import { canForRole, hasDocumentApprovalAccess } from '@/rbac/permissions';
import type { Permission } from '@/rbac/permissions';

/** Role for the tenant in the current URL (not tenants[0]). */
function tenantAccessForSlug(
  tenants: TenantSummary[],
  tenantSlug: string | undefined
): TenantSummary | undefined {
  if (!tenantSlug) return undefined;
  return tenants.find((t) => t.slug === tenantSlug);
}

/**
 * Requires authentication. Redirects to login if unauthenticated.
 */
export function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingOverlay />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

/**
 * Verifies user has access to the current tenant slug.
 * Sets the tenant in store on mount.
 */
export function TenantGuard() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { user } = useAuthStore();
  const { setTenant, clearTenant } = useTenantStore();

  useEffect(() => {
    if (!user || !tenantSlug) return;

    const tenantAccess = user.tenants.find((t) => t.slug === tenantSlug);
    if (tenantAccess) {
      setTenant({
        id: tenantAccess.id,
        slug: tenantAccess.slug,
        name: tenantAccess.name,
        logo: tenantAccess.logo,
        plan: 'starter',
      });
    }

    return () => {
      clearTenant();
    };
  }, [user, tenantSlug, setTenant, clearTenant]);

  useEffect(() => {
    if (!tenantSlug || !user?.tenants.some((t) => t.slug === tenantSlug)) return;
    let cancelled = false;
    organizationApi
      .get()
      .then((org) => {
        if (cancelled) return;
        const ct = useTenantStore.getState().currentTenant;
        if (!ct || ct.slug !== tenantSlug) return;
        const ot = org.orgType as OrgType | undefined;
        if (ot && ct.orgType !== ot) {
          setTenant({ ...ct, orgType: ot });
        }
      })
      .catch(() => {
        /* non-fatal: sidebar / forms fall back until organisation can be loaded */
      });
    return () => {
      cancelled = true;
    };
  }, [tenantSlug, user, setTenant]);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const hasTenantAccess = user.tenants.some((t) => t.slug === tenantSlug);
  if (!hasTenantAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="max-w-md text-center">
          <h1 className="text-h2 mb-4">Tenant Not Found</h1>
          <p className="text-body mb-6">
            You do not have access to this organisation, or it does not exist.
          </p>
          <a href="/" className="text-button text-[var(--accent-sand)] hover:text-[var(--accent-periwinkle)]">
            Return to Login
          </a>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

/**
 * Blocks CLIENT_TEMP users from non-project routes (Dashboard, Kanban,
 * Calendar, Grants, Settings, Reports, Files manager).
 */
export function PermanentUserGuard() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { user } = useAuthStore();
  const { allowedProjectIds } = useClientAccessStore();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const tenantAccess = tenantAccessForSlug(user.tenants, tenantSlug);
  if (tenantAccess?.role === 'CLIENT_TEMP' && tenantSlug) {
    const firstProjectId = allowedProjectIds[0];
    return (
      <Navigate
        to={
          firstProjectId
            ? `/${tenantSlug}/projects/${firstProjectId}`
            : `/${tenantSlug}/projects`
        }
        replace
      />
    );
  }

  return <Outlet />;
}

/**
 * For CLIENT_TEMP users on project routes: verifies the current project ID
 * is in their allowed scope. Non-CLIENT_TEMP users pass through.
 *
 * The allowed projectIds are fetched via the client-access-check endpoint
 * and cached in clientAccessStore. For the stub, we allow through and rely
 * on server-side enforcement until the API is wired.
 */
export function ClientGuard() {
  const { tenantSlug, id } = useParams<{ tenantSlug: string; id?: string }>();
  const { user } = useAuthStore();
  const { setExpiresAt, setAllowedProjectIds, clearClientTempScope } =
    useClientAccessStore();

  const [isChecking, setIsChecking] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const tenantAccess = user ? tenantAccessForSlug(user.tenants, tenantSlug) : undefined;
  const isClientTemp = tenantAccess?.role === 'CLIENT_TEMP';

  useEffect(() => {
    if (!user || !isClientTemp || !tenantSlug || !id) {
      return;
    }

    const safeTenantSlug = tenantSlug as string;
    const safeProjectId = id as string;

    let cancelled = false;

    async function run() {
      setIsChecking(true);
      setHasAccess(null);
      clearClientTempScope();

      try {
        const { allowedProjectIds, expiresAt } = await clientAccessCheck({
          tenantSlug: safeTenantSlug,
          projectId: safeProjectId,
        });

        if (cancelled) return;

        setExpiresAt(expiresAt);
        setAllowedProjectIds(allowedProjectIds);
        setHasAccess(allowedProjectIds.includes(safeProjectId));
      } catch {
        if (cancelled) return;
        setHasAccess(false);
        setAllowedProjectIds([]);
      } finally {
        if (cancelled) return;
        setIsChecking(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    user,
    isClientTemp,
    tenantSlug,
    id,
    clearClientTempScope,
    setAllowedProjectIds,
    setExpiresAt,
  ]);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (tenantAccess?.role !== 'CLIENT_TEMP') {
    return <Outlet />;
  }

  // Client temp users cannot create projects.
  if (!id || !tenantSlug) {
    return <Navigate to={`/${tenantSlug ?? ''}/projects`} replace />;
  }

  if (isChecking || hasAccess == null) {
    return <LoadingOverlay />;
  }

  if (!hasAccess) {
    return <Navigate to={`/${tenantSlug}/projects`} replace />;
  }

  return <Outlet />;
}

/**
 * Verifies DEPT_ADMIN users can only access their own department's routes.
 * Non-DEPT_ADMIN users pass through.
 */
export function DeptGuard() {
  const { deptId } = useParams<{ deptId: string }>();
  const { user } = useAuthStore();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const tenantAccess = tenantAccessForSlug(user.tenants, tenantSlug);
  if (!tenantAccess) {
    return <Navigate to="/" replace />;
  }

  if (tenantAccess.role === 'DEPT_ADMIN' && tenantAccess.deptId !== deptId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="max-w-md text-center">
          <h1 className="text-h2 mb-4">Access Denied</h1>
          <p className="text-body mb-6">
            You do not have access to this department.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

/**
 * Restricts access to SUPER_ADMIN role only.
 */
export function SuperAdminGuard() {
  const { user } = useAuthStore();

  if (!user || user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

/**
 * Route-level guard for permission-based access.
 * Keeps route protection aligned with sidebar/menu permission visibility.
 */
export function PermissionGuard({
  permission,
  fallbackTo,
}: {
  permission: Permission;
  fallbackTo?: string;
}) {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const tenantRole = tenantAccessForSlug(user.tenants, tenantSlug)?.role ?? user.role;
  const hasPermission =
    permission === 'approve_documents'
      ? hasDocumentApprovalAccess(user, tenantSlug)
      : canForRole(tenantRole, permission);
  if (!hasPermission) {
    if (fallbackTo && tenantSlug) {
      return <Navigate to={`/${tenantSlug}/${fallbackTo}`} replace />;
    }
    if (tenantSlug) {
      return <Navigate to={`/${tenantSlug}/projects`} replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
