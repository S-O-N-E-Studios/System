import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import type { Activity, ScheduleActivity, ScheduleActivityStatus, SupportingImage } from '@/types';
import { formatDate } from '@/utils/formatters';
import GanttChart from '@/components/ui/GanttChart';
import ActivityImageUploader from '@/components/ui/ActivityImageUploader';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { uploadActivityImage, removeActivityImage } from '@/api/activityImages';
import { activitiesApi } from '@/api/activities';
import { projectsApi } from '@/api/projects';

type ScheduleRow = ScheduleActivity & { expectedFunds: number; actualFunds: number };

type ProjectScheduleMeta = {
  name: string;
  refCode: string;
  startDate: string;
  completionDate: string;
  progress: number;
};

function mapActivityStatus(s: string): ScheduleActivityStatus {
  if (s === 'at_risk' || s === 'at-risk') return 'at_risk';
  if (s === 'delayed') return 'delayed';
  if (s === 'complete') return 'complete';
  if (s === 'on-track' || s === 'on_track') return 'on_track';
  return 'on_track';
}

function activityToScheduleRow(a: Activity): ScheduleRow {
  return {
    id: a.id,
    name: a.name,
    startDate: a.startDate.slice(0, 10),
    endDate: a.endDate.slice(0, 10),
    status: mapActivityStatus(a.status),
    expectedFunds: a.expectedFunds ?? 0,
    actualFunds: a.actualFunds ?? 0,
  };
}

function maxIsoDate(dates: string[]): string {
  return dates.reduce((a, b) => (a >= b ? a : b), dates[0] || '');
}

function useCountdown(targetDate: string) {
  const [remaining, setRemaining] = useState(() => {
    const diff = new Date(targetDate).getTime() - Date.now();
    return Math.max(0, diff);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(targetDate).getTime() - Date.now();
      setRemaining(Math.max(0, diff));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);

  return { days, hours, minutes, seconds, isExpired: remaining <= 0 };
}

export default function ProjectActivitySchedule() {
  const { tenantSlug, id: projectId } = useParams<{ tenantSlug: string; id: string }>();
  const { user } = useAuthStore();
  const { addToast } = useUiStore();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Activity[]>([]);
  const [projectMeta, setProjectMeta] = useState<ProjectScheduleMeta | null>(null);
  const [imagesByActivityId, setImagesByActivityId] = useState<Record<string, SupportingImage[]>>({});

  const scheduleActivities = useMemo(() => rows.map(activityToScheduleRow), [rows]);

  const tenantRole =
    user && tenantSlug ? user.tenants.find((t) => t.slug === tenantSlug)?.role : undefined;
  const isClientTemp = tenantRole === 'CLIENT_TEMP';

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([projectsApi.getById(projectId), activitiesApi.list(projectId)])
      .then(([p, acts]) => {
        if (cancelled) return;
        setRows(acts);
        const actStarts = acts.map((a) => a.startDate.slice(0, 10));
        const actEnds = acts.map((a) => a.endDate.slice(0, 10));
        const start =
          p.startDate?.slice(0, 10) ??
          (actStarts.length ? actStarts.reduce((a, b) => (a <= b ? a : b)) : new Date().toISOString().slice(0, 10));
        const endFromProject = p.completionDate?.slice(0, 10);
        const endFromActs = actEnds.length ? maxIsoDate(actEnds) : '';
        const completionDate = endFromProject || endFromActs || start;
        setProjectMeta({
          name: p.name,
          refCode: p.refCode,
          startDate: start,
          completionDate,
          progress: p.percentComplete ?? 0,
        });
        setImagesByActivityId(
          Object.fromEntries(acts.map((a) => [a.id, [...(a.supportingImages ?? [])]])),
        );
      })
      .catch(() => {
        if (!cancelled) {
          addToast({ type: 'error', message: 'Could not load project schedule.' });
          setRows([]);
          setProjectMeta(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, addToast]);

  const project = projectMeta;
  const countdown = useCountdown(project?.completionDate ?? new Date().toISOString().slice(0, 10));

  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const selectedActivity = useMemo(
    () => rows.find((a) => a.id === selectedActivityId) ?? null,
    [rows, selectedActivityId],
  );

  if (loading) {
    return (
      <div className="p-8 text-[0.82rem] text-[var(--text-muted)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
        Loading schedule…
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-[0.82rem] text-[var(--text-muted)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
        Project could not be loaded.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project info + Countdown clock */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
        <div className="lg:col-span-2 p-4 bg-[var(--bg-surface)] border border-[var(--border-default)]">
          <p className="text-eyebrow mb-1">Project</p>
          <p className="text-[0.82rem] font-medium text-[var(--text-primary)]">{project.name}</p>
          <p className="text-mono text-[0.68rem] mt-1">{project.refCode}</p>
        </div>
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-default)]">
          <p className="text-eyebrow mb-1">Timeline</p>
          <p className="text-[0.82rem] text-[var(--text-primary)]">
            {formatDate(project.startDate)} to {formatDate(project.completionDate)}
          </p>
        </div>
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-default)]">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-3.5 w-3.5 text-[var(--accent-periwinkle)]" />
            <p className="text-eyebrow">Countdown to Completion</p>
          </div>
          {countdown.isExpired ? (
            <p className="text-[0.82rem] font-semibold text-[var(--status-success)]">Complete</p>
          ) : (
            <div
              className="flex items-baseline gap-1"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              <span className="text-[1.1rem] font-semibold text-[var(--text-primary)]">{countdown.days}</span>
              <span className="text-[0.6rem] text-[var(--text-muted)]">d</span>
              <span className="text-[1.1rem] font-semibold text-[var(--text-primary)] ml-1">{String(countdown.hours).padStart(2, '0')}</span>
              <span className="text-[0.6rem] text-[var(--text-muted)]">:</span>
              <span className="text-[1.1rem] font-semibold text-[var(--text-primary)]">{String(countdown.minutes).padStart(2, '0')}</span>
              <span className="text-[0.6rem] text-[var(--text-muted)]">:</span>
              <span className="text-[1.1rem] font-semibold text-[var(--text-primary)]">{String(countdown.seconds).padStart(2, '0')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Gantt chart */}
      {scheduleActivities.length === 0 ? (
        <div className="p-6 text-[0.82rem] text-[var(--text-muted)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
          No activities yet for this project.
        </div>
      ) : (
        <GanttChart
          activities={scheduleActivities}
          startMonth={new Date(project.startDate)}
          endMonth={new Date(project.completionDate)}
          onActivityClick={(activityId) => setSelectedActivityId(activityId)}
        />
      )}

      {selectedActivityId && selectedActivity && (
        <ActivityImageUploader
          activityId={selectedActivityId}
          activityName={selectedActivity.name}
          isComplete={selectedActivity.status === 'complete'}
          images={imagesByActivityId[selectedActivityId] ?? []}
          onUpload={
            isClientTemp
              ? undefined
              : async (activityId, file, caption) => {
                  if (!tenantSlug || !projectId) return;
                  try {
                    await uploadActivityImage({
                      tenantSlug,
                      projectId,
                      activityId,
                      file,
                      caption,
                    });
                    const newImage: SupportingImage = {
                      fileId: crypto.randomUUID(),
                      uploadedBy: user?.email ?? 'unknown',
                      uploadedAt: new Date().toISOString(),
                      caption,
                    };
                    setImagesByActivityId((prev) => ({
                      ...prev,
                      [activityId]: [...(prev[activityId] ?? []), newImage],
                    }));
                  } catch {
                    addToast({
                      type: 'error',
                      message: 'Image upload failed. Please try again.',
                    });
                  }
                }
          }
          onRemove={
            isClientTemp
              ? undefined
              : async (activityId, imageId) => {
                  if (!tenantSlug || !projectId) return;
                  try {
                    await removeActivityImage({
                      tenantSlug,
                      projectId,
                      activityId,
                      imageId,
                    });
                    setImagesByActivityId((prev) => ({
                      ...prev,
                      [activityId]: (prev[activityId] ?? []).filter(
                        (img) => img.fileId !== imageId
                      ),
                    }));
                  } catch {
                    addToast({
                      type: 'error',
                      message: 'Image removal failed. Please try again.',
                    });
                  }
                }
          }
        />
      )}

      {/* Expected vs Actual Funds table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)]">
        <div className="px-6 py-4 border-b border-[var(--border-default)]">
          <h3 className="text-h3">Expected vs Actual Funds</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--table-header-bg)' }}>
              <th className="text-table-header text-left px-4 py-3">Activity</th>
              <th className="text-table-header text-right px-4 py-3">Expected (R&apos;000)</th>
              <th className="text-table-header text-right px-4 py-3">Actual (R&apos;000)</th>
              <th className="text-table-header text-right px-4 py-3">Variance</th>
              <th className="text-table-header text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {scheduleActivities.map((act, i) => {
              const variance = act.actualFunds - act.expectedFunds;
              const isOver = variance > 0;
              const isUnder = variance < 0 && act.actualFunds > 0;
              return (
                <tr
                  key={act.id}
                  className={[
                    'border-b border-[var(--border-default)]',
                    i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-surface)]',
                  ].join(' ')}
                >
                  <td className="px-4 py-3 text-[0.82rem] text-[var(--text-primary)]">{act.name}</td>
                  <td
                    className="px-4 py-3 text-right text-[0.82rem]"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", color: 'var(--text-muted)' }}
                  >
                    {isClientTemp ? '—— Restricted' : act.expectedFunds}
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[0.82rem]"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", color: 'var(--text-financial)' }}
                  >
                    {isClientTemp ? '—— Restricted' : act.actualFunds || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isClientTemp ? (
                      <span className="text-[0.78rem] text-[var(--text-muted)]">—— Restricted</span>
                    ) : act.actualFunds > 0 ? (
                      <span
                        className="inline-flex items-center gap-1 text-[0.78rem]"
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          color: isOver
                            ? 'var(--status-danger)'
                            : isUnder
                              ? 'var(--status-success)'
                              : 'var(--text-muted)',
                        }}
                      >
                        {isOver && <TrendingUp className="h-3 w-3" />}
                        {isUnder && <TrendingDown className="h-3 w-3" />}
                        {variance > 0 ? `+${variance}` : variance === 0 ? '0' : String(variance)}
                      </span>
                    ) : (
                      <span className="text-[0.78rem] text-[var(--text-muted)]">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-[0.68rem] font-semibold uppercase tracking-wider"
                      style={{
                        color: act.status === 'on_track'
                          ? 'var(--status-success)'
                          : act.status === 'at_risk'
                            ? 'var(--status-warning)'
                            : 'var(--status-danger)',
                      }}
                    >
                      {act.status.replace('_', ' ')}
                    </span>
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
