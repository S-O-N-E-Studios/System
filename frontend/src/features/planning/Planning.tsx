import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { planningApi } from '@/api/planning';
import type { MultiYearPlan, ServiceCategory } from '@/types';
import { SERVICE_CATEGORY_LABELS, FUNDER_TYPE_LABELS } from '@/types';

type ViewMode = 'table' | 'timeline';

export default function Planning() {
  const { tenantSlug } = useParams();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<MultiYearPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filters, setFilters] = useState({
    plannedYear: undefined as number | undefined,
    serviceCategory: '' as string,
    status: '' as string,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params: Record<string, unknown> = {};
        if (filters.plannedYear) params.plannedYear = filters.plannedYear;
        if (filters.serviceCategory) params.serviceCategory = filters.serviceCategory;
        if (filters.status) params.status = filters.status;
        const result = await planningApi.list(params as Parameters<typeof planningApi.list>[0]);
        if (!cancelled) setPlans(result.plans);
      } catch {
        if (!cancelled) setPlans([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [filters]);

  const handleBeginInception = async (planId: string) => {
    try {
      const project = await planningApi.beginInception(planId);
      navigate(`/${tenantSlug}/projects/${project.id}`);
    } catch {
      // inception failed — UI will remain on the planning page
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      planned: 'bg-[var(--warning)]/10 text-[var(--warning)]',
      selected_for_inception: 'bg-[var(--accent)]/10 text-[var(--accent)]',
      active: 'bg-[var(--success)]/10 text-[var(--success)]',
      cancelled: 'bg-[var(--danger)]/10 text-[var(--danger)]',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium ${colors[status] || ''}`}>
        {status.replace(/_/g, ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-h1">Multi-Year Planning</h1>
          <p className="text-sm text-[var(--text-secondary)]">Year 1 to Year 5 project planning framework</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setViewMode(viewMode === 'table' ? 'timeline' : 'table')}
            className="px-3 py-1.5 text-sm border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
          >
            {viewMode === 'table' ? 'Timeline View' : 'Table View'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filters.plannedYear || ''}
          onChange={(e) => setFilters({ ...filters, plannedYear: e.target.value ? Number(e.target.value) : undefined })}
          className="px-3 py-1.5 text-sm border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
        >
          <option value="">All Years</option>
          {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>Year {y}</option>)}
        </select>
        <select
          value={filters.serviceCategory}
          onChange={(e) => setFilters({ ...filters, serviceCategory: e.target.value })}
          className="px-3 py-1.5 text-sm border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
        >
          <option value="">All Categories</option>
          {Object.entries(SERVICE_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-1.5 text-sm border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
        >
          <option value="">All Statuses</option>
          <option value="planned">Planned</option>
          <option value="selected_for_inception">Selected for Inception</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table View */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-[var(--text-muted)]">Loading...</div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
          <p className="text-lg font-medium">No planning entries found</p>
          <p className="text-sm mt-1">Create multi-year plan entries to get started</p>
        </div>
      ) : (
        <div className="border border-[var(--border)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-surface-alt)]">
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Municipality</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[var(--text-muted)] uppercase">Year</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">FY</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-muted)] uppercase">Est. Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Funder</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-muted)] uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-surface-alt)]/50">
                  <td className="px-4 py-3 text-[var(--text-primary)] font-medium">{plan.projectName}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{SERVICE_CATEGORY_LABELS[plan.serviceCategory as ServiceCategory] || plan.serviceCategory}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{plan.localMunicipality || '—'}</td>
                  <td className="px-4 py-3 text-center font-mono text-[var(--text-primary)]">{plan.plannedYear}</td>
                  <td className="px-4 py-3 font-mono text-[var(--text-secondary)]">{plan.financialYear}</td>
                  <td className="px-4 py-3 text-right font-mono text-[var(--text-financial)]">R{(plan.estimatedValue / 100).toLocaleString()}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{FUNDER_TYPE_LABELS[plan.funderType] || plan.funderType}</td>
                  <td className="px-4 py-3">{statusBadge(plan.status)}</td>
                  <td className="px-4 py-3 text-right">
                    {plan.status === 'planned' && !plan.linkedProjectId && (
                      <button
                        onClick={() => handleBeginInception(plan.id)}
                        className="px-2 py-1 text-xs bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                      >
                        Begin Inception
                      </button>
                    )}
                    {plan.linkedProjectId && (
                      <button
                        onClick={() => navigate(`/${tenantSlug}/projects/${plan.linkedProjectId}`)}
                        className="px-2 py-1 text-xs border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-alt)]"
                      >
                        View Project
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
