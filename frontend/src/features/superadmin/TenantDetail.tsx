import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import { ArrowLeft } from 'lucide-react';
import apiClient from '@/api/client';
import { formatDate } from '@/utils/formatters';

type TenantDetailModel = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  users: number;
  isActive: boolean;
  createdAtLabel: string;
};

function mapTenantDetail(raw: Record<string, unknown>): TenantDetailModel {
  const id = String(raw._id ?? raw.id ?? '');
  const status = String(raw.status ?? 'trial');
  const createdRaw = raw.createdAt;
  return {
    id,
    name: String(raw.name ?? ''),
    slug: String(raw.slug ?? ''),
    plan: String(raw.plan ?? '—'),
    users: typeof raw.userCount === 'number' ? raw.userCount : 0,
    isActive: status !== 'suspended',
    createdAtLabel:
      createdRaw != null && String(createdRaw)
        ? formatDate(String(createdRaw))
        : 'N/A',
  };
}

export default function TenantDetail() {
  const { id } = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<TenantDetailModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) {
      setTenant(null);
      setError(true);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(false);
        const res = await apiClient.get(`/super-admin/tenants/${id}`);
        const body = res.data?.data ?? res.data;
        const raw = body?.tenant as Record<string, unknown> | undefined;
        if (cancelled) return;
        if (raw && typeof raw === 'object') {
          setTenant(mapTenantDetail(raw));
        } else {
          setTenant(null);
          setError(true);
        }
      } catch {
        if (!cancelled) {
          setTenant(null);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

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

      {loading ? (
        <LoadingState title="Loading tenant…" />
      ) : error || !tenant ? (
        <ErrorState
          title="Tenant not found"
          description="This tenant could not be loaded."
          action={
            <Link to="/super-admin/tenants">
              <Button variant="secondary">Back to tenants</Button>
            </Link>
          }
        />
      ) : (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-h3">{tenant.name}</h3>
          <StatusBadge status={tenant.isActive ? 'active' : 'danger'}>
            {tenant.isActive ? 'Active' : 'Suspended'}
          </StatusBadge>
        </div>

        <div className="flex flex-col gap-3">
          {[
            { label: 'Tenant ID', value: tenant.id || id || 'N/A' },
            { label: 'Slug', value: tenant.slug },
            { label: 'Plan', value: tenant.plan },
            { label: 'Users', value: String(tenant.users) },
            { label: 'Created', value: tenant.createdAtLabel },
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
      )}
    </div>
  );
}
