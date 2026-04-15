import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import StatusBadge from '@/components/ui/StatusBadge';
import { projectsApi } from '@/api/projects';
import { clientAccessApi } from '@/api/clientAccess';
import { useUiStore } from '@/store/uiStore';
import type { TemporaryAccess } from '@/types';

function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export default function ClientAccessSettings() {
  const { tenantSlug = '' } = useParams<{ tenantSlug: string }>();
  const { addToast } = useUiStore();
  const [grants, setGrants] = useState<TemporaryAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [portfolioProjects, setPortfolioProjects] = useState<{ id: string; name: string }[]>([]);

  const loadGrants = useCallback(() => {
    if (!tenantSlug) return;
    setLoading(true);
    clientAccessApi
      .list(tenantSlug)
      .then(setGrants)
      .catch(() => setGrants([]))
      .finally(() => setLoading(false));
  }, [tenantSlug]);

  useEffect(() => {
    loadGrants();
  }, [loadGrants]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { projects } = await projectsApi.list({ limit: 100 });
        if (!cancelled) {
          setPortfolioProjects(projects.map((p) => ({ id: p.id, name: p.name })));
        }
      } catch {
        if (!cancelled) setPortfolioProjects([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  const projectName = useMemo(() => {
    const map = new Map(portfolioProjects.map((p) => [p.id, p.name]));
    return (id: string) => map.get(id) ?? id;
  }, [portfolioProjects]);

  const extend = async (id: string) => {
    if (!tenantSlug) return;
    const g = grants.find((x) => x.id === id);
    if (!g) return;
    const nextExpiry = addDaysIso(g.expiresAt, 7);
    try {
      await clientAccessApi.extend(tenantSlug, id, nextExpiry);
      addToast({ type: 'success', message: 'Access extended by 7 days.' });
      loadGrants();
    } catch {
      addToast({ type: 'error', message: 'Could not extend access.' });
    }
  };

  const revoke = async (id: string) => {
    if (!tenantSlug) return;
    try {
      await clientAccessApi.revoke(tenantSlug, id);
      addToast({ type: 'success', message: 'Grant revoked.' });
      loadGrants();
    } catch {
      addToast({ type: 'error', message: 'Could not revoke access.' });
    }
  };

  const colWidths = ['22%', '25%', '13%', '12%', '28%'];

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)]">
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <h3 className="text-h3">Client access</h3>
        <p className="text-[0.72rem] text-[var(--text-muted)] mt-1">
          Temporary client grants for this organisation. Data loads from the server.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px]" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            {colWidths.map((w) => (
              <col key={w} style={{ width: w }} />
            ))}
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
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)] text-[0.82rem]">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && grants.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)] text-[0.82rem]">
                  No client access grants yet.
                </td>
              </tr>
            )}
            {!loading &&
              grants.map((g, i) => {
                const projectNames = g.projectIds.map((pid) => projectName(pid)).join(', ');
                const isActive = g.status === 'active';
                return (
                  <tr
                    key={g.id}
                    className={`border-b border-[var(--border)] align-middle ${i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-card)]'}`}
                  >
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
                    <td className="px-4 py-3 max-w-0 overflow-hidden">
                      <span className="block text-[0.78rem] text-[var(--text-secondary)] truncate" title={projectNames}>
                        {projectNames}
                      </span>
                      <span className="text-[0.62rem] text-[var(--text-muted)]">
                        {g.projectIds.length} project{g.projectIds.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-[0.72rem] font-mono text-[var(--text-secondary)]">
                        {new Date(g.expiresAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={isActive ? 'active' : g.status === 'expired' ? 'review' : 'danger'}
                      >
                        {g.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-nowrap">
                        <button
                          type="button"
                          disabled={!isActive}
                          onClick={() => void extend(g.id)}
                          title={!isActive ? 'Grant is no longer active' : 'Extend access by 7 days'}
                          className="shrink-0 px-3 py-1 text-[0.7rem] font-medium border transition-colors whitespace-nowrap disabled:opacity-35 disabled:cursor-not-allowed"
                          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                          onMouseEnter={(e) => {
                            if (isActive) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                          }}
                        >
                          +7 days
                        </button>
                        <button
                          type="button"
                          disabled={!isActive}
                          onClick={() => void revoke(g.id)}
                          title={!isActive ? 'Grant is no longer active' : 'Revoke access immediately'}
                          className="shrink-0 px-3 py-1 text-[0.7rem] font-medium border transition-colors whitespace-nowrap disabled:opacity-35 disabled:cursor-not-allowed"
                          style={{ borderColor: 'var(--border)', color: 'var(--status-danger)' }}
                          onMouseEnter={(e) => {
                            if (isActive)
                              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--status-danger)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                          }}
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
