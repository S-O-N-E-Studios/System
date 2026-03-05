import { useParams, Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { ArrowLeft } from 'lucide-react';

export default function TenantDetail() {
  const { id } = useParams<{ id: string }>();

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
          <h3 className="text-h3">Limpopo Civil Engineering</h3>
          <StatusBadge status="active">Active</StatusBadge>
        </div>

        <div className="flex flex-col gap-3">
          {[
            { label: 'Tenant ID', value: id ?? '—' },
            { label: 'Slug', value: 'limpopo-civil' },
            { label: 'Plan', value: 'Starter' },
            { label: 'Users', value: '4' },
            { label: 'Created', value: '9 Feb 2026' },
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
