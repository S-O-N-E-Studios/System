import { Link } from 'react-router-dom';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

const mockTenants = [
  { id: '1', name: 'Limpopo Civil Engineering', slug: 'limpopo-civil', plan: 'Starter', users: 4, isActive: true },
  { id: '2', name: 'Gauteng Structures Corp', slug: 'gauteng-structures', plan: 'Professional', users: 12, isActive: true },
  { id: '3', name: 'Cape Town Roads Dept', slug: 'ct-roads', plan: 'Starter', users: 2, isActive: false },
];

export default function Tenants() {
  return (
    <div className="animate-fade-in max-w-5xl mx-auto px-6 py-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-eyebrow mb-2">Super Admin</p>
          <h1 className="text-h1">All Tenants</h1>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)]">
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--table-header-bg)' }}>
              {['Organisation', 'Slug', 'Plan', 'Users', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-table-header text-left px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockTenants.map((t, i) => (
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
      </div>
    </div>
  );
}
