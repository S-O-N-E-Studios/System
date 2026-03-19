import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTenantStore } from '@/store/tenantStore';
import { getGreeting } from '@/utils/formatters';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { Download, MapPin } from 'lucide-react';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import { fetchDashboardSummary } from '@/api/dashboard';

function formatBudgetLabel(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)}M`;
  return `${amount}`;
}

export default function Dashboard() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { user } = useAuthStore();
  const { currentTenant } = useTenantStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<ReturnType<typeof Array.prototype.slice>>([]);
  const [recentProjects, setRecentProjects] = useState<ReturnType<typeof Array.prototype.slice>>(
    []
  );
  const [tasks, setTasks] = useState<ReturnType<typeof Array.prototype.slice>>([]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        const summary = await fetchDashboardSummary();

        if (!isMounted) return;

        setDepartments(summary.departments);
        setRecentProjects(summary.recentProjects);
        setTasks(summary.outstandingTasks);
      } catch (err) {
        if (!isMounted) return;
        // For now just capture a simple message; UI shows generic error
        setError('Failed to load dashboard data.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  const greeting = getGreeting();
  const firstName = user?.firstName ?? 'User';
  const tenantName = currentTenant?.name ?? 'Mpumalanga Provincial Government';

  const maxBudget =
    departments.length > 0 ? Math.max(...departments.map((d: any) => d.budget)) : 0;

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <LoadingState title="Loading dashboard" description="Fetching latest portfolio data." />
      </div>
    );
  }

  if (error) {
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
        <Button variant="secondary">
          <Download className="h-3.5 w-3.5" />
          Export Portfolio
        </Button>
      </div>

      {/* Province map + tenant name */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-8 mb-8">
        <h2 className="text-h2 mb-6">{tenantName}</h2>
        <div className="aspect-[2/1] bg-[var(--bg-surface-alt)] border border-dashed border-[var(--border-default)] flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-10 w-10 text-[var(--accent-periwinkle)] mx-auto mb-3" />
            <p className="text-h3 mb-1">Province Map</p>
            <p className="text-[0.72rem] text-[var(--text-muted)]">
              Interactive province map with department regions.
              <br />
              GeoJSON data source required (Open Item #6).
            </p>
          </div>
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
              {departments.map((dept: any, i: number) => {
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
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {formatBudgetLabel(dept.budget)}
                    </span>

                    {/* Bar container */}
                    <div className="w-full max-w-[80px] relative" style={{ height: '200px' }}>
                      {/* Total budget bar */}
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-[var(--accent-sand)] group-hover:bg-[var(--accent-periwinkle)] transition-colors"
                        style={{
                          height: `${barHeight}%`,
                          animation: `barGrow 0.8s ease-out ${i * 0.1}s both`,
                          transformOrigin: 'bottom',
                        }}
                      >
                        {/* Spent overlay */}
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-[var(--status-warning)] opacity-60"
                          style={{
                            height: dept.budget
                              ? `${(dept.spent / dept.budget) * 100}%`
                              : '0%',
                          }}
                        />
                      </div>
                    </div>

                    {/* Department label */}
                    <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--text-muted)] group-hover:text-[var(--accent-sand)] transition-colors text-center">
                      {dept.name}
                    </span>
                  </Link>
                );
              })}
            </div>
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[var(--accent-sand)]" />
                <span className="text-[0.62rem] text-[var(--text-muted)]">Total Budget</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[var(--status-warning)] opacity-60" />
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
              {recentProjects.map((p: any) => (
                <Link
                  key={p.id}
                  to={`/${tenantSlug}/projects/${p.id}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-[var(--accent-sand-glow)] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge status={p.status}>
                      {p.status === 'active' ? 'Active' : 'In Review'}
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
              {tasks.map((t: any) => (
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
