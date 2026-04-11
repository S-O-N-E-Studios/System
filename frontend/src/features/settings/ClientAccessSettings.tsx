import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import StatusBadge from '@/components/ui/StatusBadge';
import { MOCK_PORTFOLIO_PROJECTS } from '@/mocks/portfolioProjects';
import { useUiStore } from '@/store/uiStore';
import type { TemporaryAccess } from '@/types';

function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const initialGrants = (tenantSlug: string): TemporaryAccess[] => [
  {
    id: 'mock-grant-1',
    tenantId: tenantSlug,
    grantedBy: 'fortune@project360.co.za',
    clientEmail: 'client@example.com',
    projectIds: ['1'],
    expiresAt: addDaysIso(new Date().toISOString(), 14),
    grantedAt: new Date(Date.now() - 5 * 24 * 3_600_000).toISOString(),
    status: 'active',
    extensionHistory: [],
    notes: 'Road rehabilitation read-only',
  },
  {
    id: 'mock-grant-2',
    tenantId: tenantSlug,
    grantedBy: 'thabo@project360.co.za',
    clientEmail: 'reviewer@municipality.gov.za',
    projectIds: ['1', '2'],
    expiresAt: addDaysIso(new Date().toISOString(), 3),
    grantedAt: new Date(Date.now() - 2 * 24 * 3_600_000).toISOString(),
    status: 'active',
    extensionHistory: [],
  },
];

export default function ClientAccessSettings() {
  const { tenantSlug = '' } = useParams<{ tenantSlug: string }>();
  const { addToast } = useUiStore();
  const [grants, setGrants] = useState<TemporaryAccess[]>(() => initialGrants(tenantSlug));

  const projectName = useMemo(() => {
    const map = new Map(MOCK_PORTFOLIO_PROJECTS.map((p) => [p.id, p.name]));
    return (id: string) => map.get(id) ?? id;
  }, []);

  const extend = (id: string) => {
    setGrants((prev) =>
      prev.map((g) =>
        g.id === id
          ? {
              ...g,
              expiresAt: addDaysIso(g.expiresAt, 7),
              extensionHistory: [
                ...g.extensionHistory,
                {
                  previousExpiry: g.expiresAt,
                  newExpiry: addDaysIso(g.expiresAt, 7),
                  extendedBy: 'you@mock.local',
                  extendedAt: new Date().toISOString(),
                },
              ],
            }
          : g,
      ),
    );
    addToast({ type: 'success', message: 'Access extended by 7 days (mock).' });
  };

  const revoke = (id: string) => {
    setGrants((prev) =>
      prev.map((g) =>
        g.id === id
          ? {
              ...g,
              status: 'revoked' as const,
              revokedAt: new Date().toISOString(),
              revokedBy: 'you@mock.local',
            }
          : g,
      ),
    );
    addToast({ type: 'info', message: 'Grant revoked (mock; no API call).' });
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)]">
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <h3 className="text-h3">Client access</h3>
        <p className="text-[0.72rem] text-[var(--text-muted)] mt-1">
          Temporary client grants (mock data). Wire to <span className="font-mono">GET /:tenant/client-access</span> when
          the backend is ready.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px]" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '22%' }} />  {/* Client email */}
            <col style={{ width: '25%' }} />  {/* Projects */}
            <col style={{ width: '13%' }} />  {/* Expires */}
            <col style={{ width: '12%' }} />  {/* Status */}
            <col style={{ width: '28%' }} />  {/* Actions — wide enough for +7 days + Revoke */}
          </colgroup>
          <thead>
            <tr style={{ background: 'var(--table-header-bg)' }}>
              {['Client', 'Projects', 'Expires', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-table-header text-left px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grants.map((g, i) => {
              const projectNames = g.projectIds.map((pid) => projectName(pid)).join(', ');
              const isActive = g.status === 'active';
              return (
                <tr
                  key={g.id}
                  className={`border-b border-[var(--border)] align-middle ${i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-card)]'}`}
                >
                  {/* Client email */}
                  <td className="px-4 py-3 max-w-0 overflow-hidden">
                    <span
                      className="block text-[0.78rem] font-mono text-[var(--text-primary)] truncate"
                      title={g.clientEmail}
                    >
                      {g.clientEmail}
                    </span>
                    {g.notes && (
                      <span className="block text-[0.62rem] text-[var(--text-muted)] truncate mt-0.5" title={g.notes}>
                        {g.notes}
                      </span>
                    )}
                  </td>
                  {/* Projects */}
                  <td className="px-4 py-3 max-w-0 overflow-hidden">
                    <span
                      className="block text-[0.78rem] text-[var(--text-secondary)] truncate"
                      title={projectNames}
                    >
                      {projectNames}
                    </span>
                    <span className="text-[0.62rem] text-[var(--text-muted)]">
                      {g.projectIds.length} project{g.projectIds.length !== 1 ? 's' : ''}
                    </span>
                  </td>
                  {/* Expires */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-[0.72rem] font-mono text-[var(--text-secondary)]">
                      {new Date(g.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={isActive ? 'active' : g.status === 'expired' ? 'review' : 'danger'}
                    >
                      {g.status}
                    </StatusBadge>
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-nowrap">
                      <button
                        type="button"
                        disabled={!isActive}
                        onClick={() => extend(g.id)}
                        title={!isActive ? 'Grant is no longer active' : 'Extend access by 7 days'}
                        className="shrink-0 px-3 py-1 text-[0.7rem] font-medium border transition-colors whitespace-nowrap disabled:opacity-35 disabled:cursor-not-allowed"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => { if (isActive) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
                      >
                        +7 days
                      </button>
                      <button
                        type="button"
                        disabled={!isActive}
                        onClick={() => revoke(g.id)}
                        title={!isActive ? 'Grant is no longer active' : 'Revoke access immediately'}
                        className="shrink-0 px-3 py-1 text-[0.7rem] font-medium border transition-colors whitespace-nowrap disabled:opacity-35 disabled:cursor-not-allowed"
                        style={{ borderColor: 'var(--border)', color: 'var(--status-danger)' }}
                        onMouseEnter={(e) => { if (isActive) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--status-danger)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
                      >
                        Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
