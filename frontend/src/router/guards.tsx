import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTenantStore } from '@/store/tenantStore';
import { useEffect } from 'react';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

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
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const tenantAccess = user.tenants[0];
  if (tenantAccess?.role === 'CLIENT_TEMP') {
    const slug = tenantAccess.slug;
    return <Navigate to={`/${slug}/projects`} replace />;
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
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Non-CLIENT_TEMP users pass through
  const tenantAccess = user.tenants[0];
  if (tenantAccess?.role !== 'CLIENT_TEMP') {
    return <Outlet />;
  }

  // TODO: Wire to GET /:tenantSlug/projects/:id/client-access-check
  // For now, allow through and rely on server-side scope enforcement
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

  const tenantAccess = user.tenants.find((t) => t.slug === tenantSlug);
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
