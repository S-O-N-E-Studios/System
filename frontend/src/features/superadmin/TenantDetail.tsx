import { useParams, Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useTenant } from '@/hooks/useTenants';
import { ArrowLeft } from 'lucide-react';

export default function TenantDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: tenant, isLoading, error } = useTenant(id);

  if (isLoading) {
    return (
      <div className="min-h-[400px] relative">
        <LoadingOverlay fullscreen={false} />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="p-8 text-center">
        <p className="text-[0.82rem] text-[var(--status-danger)]">
          Failed to load tenant details.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-3xl mx-auto px-6 py-20">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/super-admin/tenants" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-eyebrow mb-1">Super Admin</p>
          <h1 className="text-h1">Tenant Detail</h1>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-h3">{tenant.name}</h3>
          <StatusBadge status={tenant.isActive ? 'active' : 'danger'}>
            {tenant.isActive ? 'Active' : 'Suspended'}
          </StatusBadge>
        </div>

        <div className="flex flex-col gap-3">
          {[
            { label: 'Tenant ID', value: tenant.id },
            { label: 'Slug', value: tenant.slug },
            { label: 'Plan', value: tenant.plan },
            { label: 'Users', value: String(tenant.userCount) },
            { label: 'Created', value: tenant.createdAt },
          ].map((row) => (
            <div key={row.label} className="flex items-baseline justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[0.7rem] text-[var(--text-muted)]">{row.label}</span>
              <span className="text-[0.82rem] text-[var(--text-primary)]">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Button variant="danger">Suspend Tenant</Button>
          <Button variant="secondary">Reset Admin Password</Button>
        </div>
      </div>
    </div>
  );
}
