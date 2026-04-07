import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTenantStore } from '@/store/tenantStore';
import { getGreeting, formatRands } from '@/utils/formatters';
import {
  buildNarrativePdfBlob,
  downloadExportedFile,
  exportWorkbookXlsx,
  type NarrativePdfSection,
} from '@/utils/clientExports';
import { useUiStore } from '@/store/uiStore';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { Download } from 'lucide-react';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import ProvinceGeoJsonMap from '@/components/ui/ProvinceGeoJsonMap';
import {
  fetchDashboardSummary,
  type DepartmentBudgetSummary,
  type RecentProjectSummary,
  type OutstandingTaskSummary,
} from '@/api/dashboard';

function formatBudgetLabel(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)}M`;
  return `${amount}`;
}

function projectStatusToBadge(
  status: RecentProjectSummary['status']
): 'active' | 'review' | 'planning' | 'done' {
  return status === 'completed' ? 'done' : status;
}

export default function Dashboard() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { user } = useAuthStore();
  const { currentTenant } = useTenantStore();
  const { addToast } = useUiStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'summary', tenantSlug],
    queryFn: fetchDashboardSummary,
  });

  const departments: DepartmentBudgetSummary[] = data?.departments ?? [];
  const recentProjects: RecentProjectSummary[] = data?.recentProjects ?? [];
  const tasks: OutstandingTaskSummary[] = data?.outstandingTasks ?? [];
  const error = isError;

  const greeting = getGreeting();
  const firstName = user?.firstName ?? 'User';

  const maxBudget =
    departments.length > 0 ? Math.max(...departments.map((d) => d.budget)) : 0;

  const tenantName = currentTenant?.name ?? 'Mpumalanga Provincial Government';

  const handleExportPdf = () => {
    if (!data) {
      addToast({ type: 'warning', message: 'Nothing to export yet.' });
      return;
    }
    const sections: NarrativePdfSection[] = [];
    if (departments.length > 0) {
      sections.push({
        title: 'Department budgets',
        lines: departments.map((d) => {
          const pct = d.budget ? Math.round((d.spent / d.budget) * 100) : 0;
          return {
            label: d.fullName || d.name,
            value: `${formatRands(d.budget)} budget · ${formatRands(d.spent)} spent · ${pct}% utilised`,
          };
        }),
      });
    }
    if (recentProjects.length > 0) {
      sections.push({
        title: 'Recent projects',
        lines: recentProjects.map((p) => ({
          label: p.name,
          value: `${p.dept} · ${
            p.status === 'active'
              ? 'Active'
              : p.status === 'completed'
                ? 'Completed'
                : p.status === 'review'
                  ? 'In review'
                  : 'Not started'
          } · ${p.updatedAt}`,
        })),
      });
    }
    if (tasks.length > 0) {
      sections.push({
        title: 'Outstanding tasks',
        lines: tasks.map((t) => ({
          label: t.title,
          value: `${t.due} · ${t.dueStatus === 'danger' ? 'Overdue / urgent' : t.dueStatus === 'review' ? 'Due soon' : 'Scheduled'}`,
        })),
      });
    }
    if (sections.length === 0) {
      addToast({ type: 'warning', message: 'Nothing to export yet.' });
      return;
    }
    const blob = buildNarrativePdfBlob({
      documentTitle: `Dashboard · ${tenantName}`,
      sections,
    });
    downloadExportedFile(blob, `Dashboard-${tenantSlug ?? 'portfolio'}.pdf`);
  };

  const handleExportXlsx = async () => {
    if (!data) {
      addToast({ type: 'warning', message: 'Nothing to export yet.' });
      return;
    }
    const hasAny = departments.length > 0 || recentProjects.length > 0 || tasks.length > 0;
    if (!hasAny) {
      addToast({ type: 'warning', message: 'Nothing to export yet.' });
      return;
    }
    const sheets: Parameters<typeof exportWorkbookXlsx>[1] = [];
    if (departments.length > 0) {
      sheets.push({
        sheetName: 'Departments',
        columns: [
          { key: 'name', header: 'Name' },
          { key: 'fullName', header: 'Full name' },
          {
            key: 'budget',
            header: 'Budget',
            formatter: (v) => formatRands(Number(v)),
          },
          {
            key: 'spent',
            header: 'Spent',
            formatter: (v) => formatRands(Number(v)),
          },
          {
            key: 'pct',
            header: '% utilised',
            formatter: (_, row) => {
              const b = Number(row.budget);
              const s = Number(row.spent);
              return b ? String(Math.round((s / b) * 100)) : '0';
            },
          },
        ],
        rows: departments.map((d) => ({
          name: d.name,
          fullName: d.fullName,
          budget: d.budget,
          spent: d.spent,
        })),
      });
    }
    if (recentProjects.length > 0) {
      sheets.push({
        sheetName: 'Recent projects',
        columns: [
          { key: 'name', header: 'Project' },
          { key: 'dept', header: 'Department' },
          {
            key: 'status',
            header: 'Status',
            formatter: (v) =>
              v === 'active'
                ? 'Active'
                : v === 'completed'
                  ? 'Completed'
                  : v === 'review'
                    ? 'In review'
                    : 'Not started',
          },
          { key: 'updatedAt', header: 'Updated' },
        ],
        rows: recentProjects.map((p) => ({
          name: p.name,
          dept: p.dept,
          status: p.status,
          updatedAt: p.updatedAt,
        })),
      });
    }
    if (tasks.length > 0) {
      sheets.push({
        sheetName: 'Outstanding tasks',
        columns: [
          { key: 'title', header: 'Task' },
          { key: 'due', header: 'Due' },
          {
            key: 'dueStatus',
            header: 'Priority',
            formatter: (v) =>
              v === 'danger' ? 'Urgent' : v === 'review' ? 'Due soon' : 'Scheduled',
          },
        ],
        rows: tasks.map((t) => ({
          title: t.title,
          due: t.due,
          dueStatus: t.dueStatus,
        })),
      });
    }
    await exportWorkbookXlsx(`Dashboard-${tenantSlug ?? 'portfolio'}.xlsx`, sheets);
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <LoadingState title="Loading dashboard" description="Fetching latest portfolio data." />
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="animate-fade-in">
        <ErrorState
          title="Unable to load dashboard"
          description="Please try again in a moment."
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-body mb-1">{greeting},</p>
          <h1 className="text-h1">{firstName}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={handleExportPdf}>
            <Download className="h-3.5 w-3.5" />
            Export PDF
          </Button>
          <Button type="button" variant="secondary" onClick={() => void handleExportXlsx()}>
            <Download className="h-3.5 w-3.5" />
            Export XLSX
          </Button>
        </div>
      </div>

      {/* Province map + tenant name */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-8 mb-8">
        <h2 className="text-h2 mb-6">{tenantName}</h2>
        <div className="h-[360px] bg-[var(--bg-surface-alt)] border border-dashed border-[var(--border-default)] overflow-hidden">
          <ProvinceGeoJsonMap height="100%" zoom={7} onRegionClick={() => {}} />
        </div>
      </div>

      {/* Department budget bars: vertical bar chart */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-8 mb-8">
        <h3 className="text-h3 mb-6">Department Budgets</h3>
        {departments.length === 0 ? (
          <EmptyState
            title="No department budget data yet."
            description="Once departments are configured with budgets, they will appear here."
          />
        ) : (
          <>
            <div className="flex items-end justify-between gap-4 h-[280px]">
              {departments.map((dept, i) => {
                const barHeight = maxBudget ? (dept.budget / maxBudget) * 100 : 0;
                return (
                  <Link
                    key={dept.id}
                    to={`/${tenantSlug}/departments/${dept.id}`}
                    className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    {/* Budget label */}
                    <span
                      className="text-financial text-[0.72rem]"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {formatBudgetLabel(dept.budget)}
                    </span>

                    {/* Bar container */}
                    <div className="w-full max-w-[80px] relative" style={{ height: '200px' }}>
                      {/* Total budget bar */}
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-[var(--chart-bar-base)] group-hover:brightness-[1.03] transition-colors"
                        style={{
                          height: `${barHeight}%`,
                          animation: `barGrow 0.8s ease-out ${i * 0.1}s both`,
                          transformOrigin: 'bottom',
                        }}
                      >
                        {/* Spent overlay */}
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-[var(--chart-bar-fill)] opacity-90"
                          style={{
                            height: dept.budget
                              ? `${(dept.spent / dept.budget) * 100}%`
                              : '0%',
                          }}
                        />
                      </div>
                    </div>

                    {/* Department label */}
                    <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--text-muted)] group-hover:text-[var(--chart-bar-fill)] transition-colors text-center">
                      {dept.name}
                    </span>
                  </Link>
                );
              })}
            </div>
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[var(--chart-bar-base)]" />
                <span className="text-[0.62rem] text-[var(--text-muted)]">Total Budget</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[var(--chart-bar-fill)] opacity-90" />
                <span className="text-[0.62rem] text-[var(--text-muted)]">Expenditure to Date</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Two-column: Recent Projects + Outstanding Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
            <h3 className="text-h3">Recent Projects</h3>
            <Link
              to={`/${tenantSlug}/projects`}
              className="text-button text-[0.6rem] text-[var(--text-muted)] hover:text-[var(--accent-sand)] transition-colors"
            >
              View All
            </Link>
          </div>
          {recentProjects.length === 0 ? (
            <EmptyState
              title="No recent projects yet."
              description="Newly created or updated projects will appear here."
              className="py-10"
            />
          ) : (
            <div className="divide-y divide-[var(--border-default)]">
              {recentProjects.map((p) => (
                <Link
                  key={p.id}
                  to={`/${tenantSlug}/projects/${p.id}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-[var(--accent-sand-glow)] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge status={projectStatusToBadge(p.status)}>
                      {p.status === 'active'
                        ? 'Active'
                        : p.status === 'completed'
                          ? 'Completed'
                          : 'In Review'}
                    </StatusBadge>
                    <div>
                      <span className="text-[0.82rem] text-[var(--text-primary)] group-hover:text-[var(--accent-sand)] transition-colors">
                        {p.name}
                      </span>
                      <span className="text-[0.62rem] text-[var(--text-muted)] ml-2">{p.dept}</span>
                    </div>
                  </div>
                  <span className="text-[0.62rem] text-[var(--text-muted)]">{p.updatedAt}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
            <h3 className="text-h3">Outstanding Tasks</h3>
            <Link
              to={`/${tenantSlug}/kanban`}
              className="text-button text-[0.6rem] text-[var(--text-muted)] hover:text-[var(--accent-sand)] transition-colors"
            >
              View Board
            </Link>
          </div>
          {tasks.length === 0 ? (
            <EmptyState
              title="No outstanding tasks."
              description="You’re fully up to date on this portfolio."
              className="py-10"
            />
          ) : (
            <div className="divide-y divide-[var(--border-default)]">
              {tasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between px-6 py-3 hover:bg-[var(--accent-sand-glow)] transition-colors"
                >
                  <span className="text-[0.82rem] text-[var(--text-primary)]">{t.title}</span>
                  <StatusBadge status={t.dueStatus}>{t.due}</StatusBadge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
