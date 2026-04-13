import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import apiClient from '@/api/client';

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  users: number;
  isActive: boolean;
};

function mapTenantListItem(raw: Record<string, unknown>): TenantRow {
  const id = String(raw._id ?? raw.id ?? '');
  const status = String(raw.status ?? 'trial');
  return {
    id,
    name: String(raw.name ?? ''),
    slug: String(raw.slug ?? ''),
    plan: String(raw.plan ?? '—'),
    users: typeof raw.userCount === 'number' ? raw.userCount : 0,
    isActive: status !== 'suspended',
  };
}

async function fetchSuperAdminTenants(): Promise<TenantRow[]> {
  try {
    const res = await apiClient.get('/super-admin/tenants');
    const body = res.data?.data ?? res.data;
    const rawList = body?.tenants;
    if (!Array.isArray(rawList)) return [];
    return rawList.map((item: Record<string, unknown>) => mapTenantListItem(item));
  } catch {
    return [];
  }
}

export default function Tenants() {
  const { data: tenants = [] } = useQuery({
    queryKey: ['super-admin', 'tenants'],
    queryFn: fetchSuperAdminTenants,
  });

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
                <td className="px-4 py-3 text-table-cell">{t.users}</td>
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
