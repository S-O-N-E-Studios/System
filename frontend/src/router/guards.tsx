import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTenantStore } from '@/store/tenantStore';
import { useEffect } from 'react';

/**
 * Requires authentication. Redirects to login if unauthenticated.
 */
export function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <AuthLoadingSkeleton />;
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
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="max-w-md text-center">
          <h1 className="text-h2 mb-4">Tenant Not Found</h1>
          <p className="text-body mb-6">
            You do not have access to this organisation, or it does not exist.
          </p>
          <a href="/" className="text-button text-accent hover:text-accent-light">
            Return to Login
          </a>
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

function AuthLoadingSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-48 skeleton" />
        <div className="h-4 w-32 skeleton" />
      </div>
    </div>
  );
}
