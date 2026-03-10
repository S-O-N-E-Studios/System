import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useProject } from '@/hooks/useProjects';
import { formatRands } from '@/utils/formatters';
import { ArrowLeft, Edit, MapPin } from 'lucide-react';
import ProjectActivitySchedule from './ProjectActivitySchedule';

type BadgeStatus = 'active' | 'review' | 'planning' | 'done' | 'danger' | 'accent';

function projectStatusToBadge(status: string): { badge: BadgeStatus; label: string } {
  switch (status) {
    case 'active': return { badge: 'active', label: 'Active' };
    case 'in_review': return { badge: 'review', label: 'In Review' };
    case 'not_started': return { badge: 'planning', label: 'Not Started' };
    case 'complete': return { badge: 'done', label: 'Complete' };
    case 'overdue': return { badge: 'danger', label: 'Overdue' };
    default: return { badge: 'planning', label: status };
  }
}

const detailTabs = ['Overview', 'Professional Services', 'Geo-Technical', 'Construction', 'Files', 'Activity'] as const;

export default function ProjectDetail() {
  const { tenantSlug, id } = useParams<{ tenantSlug: string; id: string }>();
  const [activeTab, setActiveTab] = useState<typeof detailTabs[number]>('Overview');
  const { data: project, isLoading, error } = useProject(id);

  if (isLoading) {
    return (
      <div className="min-h-[400px] relative">
        <LoadingOverlay fullscreen={false} />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-8 text-center">
        <p className="text-[0.82rem] text-[var(--status-danger)]">
          Failed to load project details.
        </p>
      </div>
    );
  }

  const expenditure = project.expenditureToDate;
  const balance = project.contractValue - expenditure;
  const percentSpent = project.contractValue > 0
    ? Math.round((expenditure / project.contractValue) * 100)
    : 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link
          to={`/${tenantSlug}/projects`}
          className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-mono">{project.referenceCode}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-h1 mb-1">{project.name}</h1>
          <StatusBadge status={projectStatusToBadge(project.status).badge}>
            {projectStatusToBadge(project.status).label}
          </StatusBadge>
        </div>
        <Link to={`/${tenantSlug}/projects/${id}/edit`}>
          <Button variant="secondary">
            <Edit className="h-3.5 w-3.5" />
            Edit Project
          </Button>
        </Link>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-0 border-b border-[var(--border)] mb-8 overflow-x-auto">
        {detailTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'text-button px-5 py-3 whitespace-nowrap transition-all duration-300',
              activeTab === tab
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-0">
            {[
              { label: 'Contract Value', value: formatRands(project.contractValue), isCurrency: true },
              { label: 'Expenditure', value: formatRands(expenditure), isCurrency: true },
              { label: 'Balance', value: formatRands(balance), isCurrency: true },
              { label: '% Spent', value: `${percentSpent}%`, isCurrency: false },
            ].map((kpi) => (
              <div key={kpi.label} className="p-6 border border-[var(--border)] bg-[var(--bg-card)]">
                <p className="text-eyebrow mb-2">{kpi.label}</p>
                <p className={kpi.isCurrency ? 'text-stat' : 'font-display text-[1.2rem] font-semibold text-[var(--text-primary)]'}>
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>

          {/* Map + Key Dates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6">
              <h3 className="text-h3 mb-4">Location</h3>
              <div className="aspect-video bg-[var(--bg-secondary)] border border-dashed border-[var(--border)] flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-8 w-8 text-[var(--accent-dim)] mx-auto mb-2" />
                  <p className="text-mono">
                    {project.gpsLatitude && project.gpsLongitude
                      ? `${project.gpsLatitude}, ${project.gpsLongitude}`
                      : 'No GPS data'}
                  </p>
                  <p className="text-[0.65rem] text-[var(--text-muted)] mt-1">Google Maps embed requires API key</p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6">
              <h3 className="text-h3 mb-4">Key Information</h3>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Start Date', value: project.startDate ?? '—' },
                  { label: 'Completion Date', value: project.completionDate ?? '—' },
                  { label: 'Project Manager', value: project.projectManagerId ?? '—' },
                  { label: 'Contractor', value: project.contractor ?? '—' },
                  { label: 'Geo-Tec Engineer', value: project.geoTecEngineer ?? '—' },
                ].map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between py-2 border-b border-[var(--border)]">
                    <span className="text-[0.7rem] text-[var(--text-muted)]">{row.label}</span>
                    <span className="text-[0.82rem] text-[var(--text-primary)]">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <p className="text-eyebrow mb-3">Progress</p>
                <ProgressBar value={project.percentComplete ?? 0} height={4} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity tab */}
      {activeTab === 'Activity' && <ProjectActivitySchedule />}

      {/* Placeholder for other tabs */}
      {activeTab !== 'Overview' && activeTab !== 'Activity' && (
        <div className="flex items-center justify-center py-20 border border-dashed border-[var(--border)]">
          <div className="text-center">
            <h3 className="text-h3 mb-2">{activeTab}</h3>
            <p className="text-body">This tab will be implemented in Sprint 4.</p>
          </div>
        </div>
      )}
    </div>
  );
}
