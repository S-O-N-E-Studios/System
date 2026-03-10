import { Link } from 'react-router-dom';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useTenants } from '@/hooks/useTenants';

export default function Tenants() {
  const { data: tenantsResponse, isLoading, error } = useTenants();
  const tenants = tenantsResponse?.data ?? [];

  if (isLoading) {
    return (
      <div className="min-h-[400px] relative">
        <LoadingOverlay fullscreen={false} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-[0.82rem] text-[var(--status-danger)]">
          Failed to load tenants.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto px-6 py-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-eyebrow mb-2">Super Admin</p>
          <h1 className="text-h1">All Tenants</h1>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)]">
        {tenants.length === 0 ? (
          <EmptyState
            title="No tenants yet."
            description="Organisations will appear here once created."
          />
        ) : (
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--table-header-bg)' }}>
              {['Organisation', 'Slug', 'Plan', 'Users', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-table-header text-left px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tenants.map((t, i) => (
              <tr key={t.id} className={`border-b border-[var(--border)] ${i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-card)]'}`}>
                <td className="px-4 py-3 text-[0.82rem] font-body font-medium text-[var(--text-primary)]">{t.name}</td>
                <td className="px-4 py-3 text-mono">{t.slug}</td>
                <td className="px-4 py-3 text-table-cell">{t.plan}</td>
                <td className="px-4 py-3 text-table-cell">{t.userCount}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={t.isActive ? 'active' : 'danger'}>
                    {t.isActive ? 'Active' : 'Suspended'}
                  </StatusBadge>
                </td>
                <td className="px-4 py-3">
                  <Link to={`/super-admin/tenants/${t.id}`}>
                    <Button variant="ghost" className="!text-[0.55rem]">View</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}
