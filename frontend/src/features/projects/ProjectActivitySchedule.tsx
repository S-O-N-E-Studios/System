import type { ScheduleActivity } from '@/types';
import { formatDate } from '@/utils/formatters';
import GanttChart from '@/components/ui/GanttChart';

const MOCK_ACTIVITIES: ScheduleActivity[] = [
  { id: '1', name: 'Site establishment & mobilisation', startDate: '2026-01-15', endDate: '2026-02-28', status: 'on_track' },
  { id: '2', name: 'Earthworks & bulk excavation', startDate: '2026-02-01', endDate: '2026-04-15', status: 'on_track' },
  { id: '3', name: 'Foundation works', startDate: '2026-03-10', endDate: '2026-05-20', status: 'at_risk' },
  { id: '4', name: 'Structural steel & concrete', startDate: '2026-04-01', endDate: '2026-07-31', status: 'on_track' },
  { id: '5', name: 'MEP installation', startDate: '2026-06-01', endDate: '2026-09-15', status: 'delayed' },
  { id: '6', name: 'Cladding & finishes', startDate: '2026-07-15', endDate: '2026-10-30', status: 'on_track' },
  {
    id: '7',
    name: 'Commissioning & handover',
    startDate: '2026-10-01',
    endDate: '2026-11-30',
    status: 'on_track',
  },
];

const MOCK_PROJECT = {
  name: 'Polokwane Water Treatment Upgrade',
  startDate: '2026-01-15',
  completionDate: '2026-11-30',
  progress: 42,
};

export default function ProjectActivitySchedule() {
  const activities = MOCK_ACTIVITIES;
  const project = MOCK_PROJECT;

  return (
    <div className="space-y-6">
      {/* Project info panel (compact summary above Gantt) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 p-4 bg-[var(--bg-card)] border border-[var(--border)]">
          <p className="text-eyebrow text-[var(--text-muted)] mb-1">Project</p>
          <p className="text-body font-medium text-[var(--text-primary)]">{project.name}</p>
        </div>
        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)]">
          <p className="text-eyebrow text-[var(--text-muted)] mb-1">Start — Completion</p>
          <p className="text-[0.82rem] text-[var(--text-primary)]">
            {formatDate(project.startDate)} — {formatDate(project.completionDate)}
          </p>
        </div>
        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)]">
          <p className="text-eyebrow text-[var(--text-muted)] mb-1">Overall progress</p>
          <p className="text-[0.82rem] font-medium text-[var(--text-primary)]">{project.progress}%</p>
        </div>
      </div>

      {/* GanttChart component (desktop) + list view (mobile) */}
      <GanttChart
        activities={activities}
        startMonth={new Date(project.startDate)}
        endMonth={new Date(project.completionDate)}
      />
    </div>
  );
}
