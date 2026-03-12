import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { getGreeting, formatRands } from '@/utils/formatters';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import ProgressBar from '@/components/ui/ProgressBar';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useDashboardStats } from '@/hooks/useDashboard';
import { FolderKanban, DollarSign, TrendingUp, FileBarChart, Plus, Download } from 'lucide-react';

export default function Dashboard() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { user } = useAuthStore();
  const { data, isLoading, error } = useDashboardStats();

  const greeting = getGreeting();
  const firstName = user?.firstName ?? 'User';

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
          Failed to load dashboard data. Please try again later.
        </p>
      </div>
    );
  }

  const stats = data?.stats;
  const recentProjects = data?.recentProjects ?? [];
  const outstandingTasks = data?.outstandingTasks ?? [];
  const sprintProgress = data?.sprintProgress ?? [];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-body mb-1">{greeting},</p>
          <h1 className="text-h1">{firstName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary">
            <Download className="h-3.5 w-3.5" />
            Export Portfolio
          </Button>
          <Link to={`/${tenantSlug}/projects/new`}>
            <Button variant="primary">
              <Plus className="h-3.5 w-3.5" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-0 mb-10">
        <StatCard
          label="Total Projects"
          value={String(stats?.totalProjects ?? 0)}
          subline="Active portfolio"
          icon={<FolderKanban className="h-5 w-5" />}
        />
        <StatCard
          label="Portfolio Value"
          value={formatRands(stats?.portfolioValue ?? 0)}
          subline="Combined contract value"
          icon={<DollarSign className="h-5 w-5" />}
          isCurrency
        />
        <StatCard
          label="Expenditure to Date"
          value={formatRands(stats?.expenditureToDate ?? 0)}
          subline={`${stats?.expenditurePercent ?? 0}% of portfolio`}
          icon={<TrendingUp className="h-5 w-5" />}
          isCurrency
        />
        <StatCard
          label="Reports Pending"
          value={String(stats?.reportsPending ?? 0)}
          subline="Awaiting submission"
          icon={<FileBarChart className="h-5 w-5" />}
        />
      </div>

      {/* Two-column layout: Recent Projects + Outstanding Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Recent Projects */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <h2 className="text-h3">Recent Projects</h2>
            <Link
              to={`/${tenantSlug}/projects`}
              className="text-button text-[0.6rem] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
            >
              View All →
            </Link>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {recentProjects.length === 0 ? (
              <EmptyState
                title="No recent projects."
                description="Create a project to see it here."
                className="py-8"
                animationClassName="w-24 h-24"
              />
            ) : (
              recentProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/${tenantSlug}/projects/${project.id}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-[var(--accent-glow)] hover:border-l-2 hover:border-l-[var(--accent)] transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge status={project.status}>
                      {project.status === 'active' ? 'Active' :
                       project.status === 'review' ? 'In Review' :
                       project.status === 'planning' ? 'Not Started' :
                       'Complete'}
                    </StatusBadge>
                    <span className="text-[0.82rem] font-body text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                      {project.name}
                    </span>
                  </div>
                  <span className="text-[0.65rem] text-[var(--text-muted)]">{project.updatedAt}</span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Outstanding Tasks */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <h2 className="text-h3">Outstanding Tasks</h2>
            <Link
              to={`/${tenantSlug}/kanban`}
              className="text-button text-[0.6rem] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
            >
              View Board →
            </Link>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {outstandingTasks.length === 0 ? (
              <EmptyState
                title="No outstanding tasks."
                description="All caught up for now."
                className="py-8"
                animationClassName="w-24 h-24"
              />
            ) : (
              outstandingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between px-6 py-3 hover:bg-[var(--accent-glow)] transition-colors"
                >
                  <span className="text-[0.82rem] font-body text-[var(--text-primary)]">
                    {task.title}
                  </span>
                  <StatusBadge status={task.dueStatus}>{task.due}</StatusBadge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sprint Summary */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)]">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-h3">Sprint Progress</h2>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {sprintProgress.length === 0 ? (
            <EmptyState
              title="No sprint data."
              description="Sprint progress will appear here once available."
              className="py-8"
              animationClassName="w-24 h-24"
            />
          ) : (
            sprintProgress.map((sprint) => (
              <div key={sprint.name} className="px-6 py-4 flex items-center gap-6">
                <div className="min-w-[200px]">
                  <p className="text-[0.82rem] font-body font-medium text-[var(--text-primary)]">
                    {sprint.name}
                  </p>
                  <p className="text-[0.65rem] text-[var(--text-muted)]">{sprint.sprint}</p>
                </div>
                <div className="flex-1">
                  <ProgressBar value={sprint.progress} />
                </div>
                <StatusBadge status={sprint.status}>
                  {sprint.status === 'active' ? 'Active' :
                   sprint.status === 'review' ? 'In Review' :
                   'Not Started'}
                </StatusBadge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
