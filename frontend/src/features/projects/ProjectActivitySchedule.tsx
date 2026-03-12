import { useParams } from 'react-router-dom';
import { formatDate } from '@/utils/formatters';
import GanttChart from '@/components/ui/GanttChart';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import EmptyState from '@/components/ui/EmptyState';
import { useActivities } from '@/hooks/useActivities';
import { useProject } from '@/hooks/useProjects';

export default function ProjectActivitySchedule() {
  const { id } = useParams<{ id: string }>();
  const { data: activities, isLoading: activitiesLoading } = useActivities(id);
  const { data: project, isLoading: projectLoading } = useProject(id);

  const isLoading = activitiesLoading || projectLoading;

  if (isLoading) {
    return (
      <div className="min-h-[200px] relative">
        <LoadingOverlay fullscreen={false} />
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <EmptyState
        title="No activities scheduled."
        description="Activities will appear here once added to this project."
      />
    );
  }

  return (
    <div className="space-y-6">
      {project && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2 p-4 bg-[var(--bg-card)] border border-[var(--border)]">
            <p className="text-eyebrow text-[var(--text-muted)] mb-1">Project</p>
            <p className="text-body font-medium text-[var(--text-primary)]">{project.name}</p>
          </div>
          <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)]">
            <p className="text-eyebrow text-[var(--text-muted)] mb-1">Start — Completion</p>
            <p className="text-[0.82rem] text-[var(--text-primary)]">
              {project.startDate ? formatDate(project.startDate) : '—'} — {project.completionDate ? formatDate(project.completionDate) : '—'}
            </p>
          </div>
          <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)]">
            <p className="text-eyebrow text-[var(--text-muted)] mb-1">Overall progress</p>
            <p className="text-[0.82rem] font-medium text-[var(--text-primary)]">{project.percentComplete ?? 0}%</p>
          </div>
        </div>
      )}

      <GanttChart
        activities={activities}
        startMonth={project?.startDate ? new Date(project.startDate) : new Date()}
        endMonth={project?.completionDate ? new Date(project.completionDate) : new Date()}
      />
    </div>
  );
}
