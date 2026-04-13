import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useParams, Link, Navigate } from 'react-router-dom';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import StageTimeline from '@/components/ui/StageTimeline';
import StageDocumentDrawer from '@/components/ui/StageDocumentDrawer';
import PaymentForecastChart from '@/components/ui/PaymentForecastChart';
import { formatRands } from '@/utils/formatters';
import { ArrowLeft, Edit, FileText, Clock, Check, X, Star } from 'lucide-react';
import ProjectLocationMap from '@/components/ui/ProjectLocationMap';
import ProjectActivitySchedule from './ProjectActivitySchedule';
import ProjectPaymentHistory from './ProjectPaymentHistory';
import { STAGE_DOCUMENT_REQUIREMENTS } from '@/constants/stageDocuments';
import { STAGE_NAMES } from '@/types';
import type { Project, ProjectFile, ProjectStage } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { EMPTY_PINNED_LIST, useProjectStore } from '@/store/projectStore';
import { useCan } from '@/rbac/useCan';
import {
  advanceProjectStage,
  fetchProjectStageStatus,
  type StageMissingDoc,
} from '@/api/projectStage';
import { filesApi } from '@/api/files';
import { projectsApi } from '@/api/projects';
import apiClient from '@/api/client';

const detailTabs = [
  'Overview',
  'Professional Services',
  'Geo-Technical',
  'Construction',
  'Activity Schedule',
  'Files',
  'Funding Sources',
] as const;


function useCountdown(targetDate: string) {
  const [remaining, setRemaining] = useState(() => {
    return Math.max(0, new Date(targetDate).getTime() - Date.now());
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.max(0, new Date(targetDate).getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);
  return { days, hours, minutes, seconds, isExpired: remaining <= 0 };
}

export default function ProjectDetail() {
  const { tenantSlug, id } = useParams<{ tenantSlug: string; id: string }>();
  const [activeTab, setActiveTab] = useState<typeof detailTabs[number]>('Overview');
  const [stageDrawerOpen, setStageDrawerOpen] = useState<ProjectStage | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [, setProjectLoading] = useState(true);
  const [fundingSources, setFundingSources] = useState<Record<string, unknown>[]>([]);

  const countdown = useCountdown(project?.completionDate || '2026-12-31');
  const [currentStage, setCurrentStage] = useState<ProjectStage>(1);
  const [stageMissingDocs, setStageMissingDocs] = useState<StageMissingDoc[]>([]);
  const [isStageLoading, setIsStageLoading] = useState(false);
  const [isStageStatusLoaded, setIsStageStatusLoaded] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [localStageUploads, setLocalStageUploads] = useState<
    Record<string, { fileName: string }>
  >({});

  const { user } = useAuthStore();
  const { addToast } = useUiStore();
  const tenantRole =
    user && tenantSlug ? user.tenants.find((t) => t.slug === tenantSlug)?.role : undefined;
  const isClientTemp = tenantRole === 'CLIENT_TEMP';
  const can = useCan();
  const canEditProject = can('edit_project');
  const togglePinnedProject = useProjectStore((s) => s.togglePinnedProject);
  const pinnedForTenant = useProjectStore((s) =>
    tenantSlug ? (s.pinnedProjectsByTenant[tenantSlug] ?? EMPTY_PINNED_LIST) : EMPTY_PINNED_LIST,
  );
  const projectDisplayName = project?.name || 'Loading…';
  const projectRef = project?.refCode || '';
  const isPinned = Boolean(tenantSlug && id && pinnedForTenant.some((p) => p.id === id));

  const [filesByStage, setFilesByStage] = useState<Record<ProjectStage, ProjectFile[]>>({
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
    8: [],
    9: [],
    10: [],
  });
  const [isFilesLoading, setIsFilesLoading] = useState(false);

  const contractValue = project?.contractValueAdjusted || project?.contractValueOriginal || project?.contractValue || 0;
  const expenditure = project?.expenditureToDate || 0;
  const balance = project?.balance ?? (contractValue - expenditure);
  const percentComplete = project?.percentComplete ?? (currentStage ? Math.round((currentStage / 6) * 100) : 0);

  const projectRecord = project as (Project & Record<string, unknown>) | null;
  const paymentPlan: { year: number; q1: number; q2: number; q3: number; q4: number }[] =
    (projectRecord?.paymentPlan as { year: number; q1: number; q2: number; q3: number; q4: number }[]) || [];
  const forecastMonthly: { month: string; amount: number }[] =
    (projectRecord?.paymentForecast as { month: string; amount: number }[]) || [];
  const actualMonthly: { month: string; amount: number }[] =
    (projectRecord?.paymentActual as { month: string; amount: number }[]) || [];

  const profServicesDocs = (() => {
    const out: { documentName: string; category: string; stage: number; uploaded: boolean; fileName?: string }[] = [];
    ([1, 2, 3, 4] as const).forEach((stage) => {
      const reqs = STAGE_DOCUMENT_REQUIREMENTS[stage];
      const stageFiles = filesByStage[stage] ?? [];
      reqs.forEach((r) => {
        const match = stageFiles.find((f) => f.category === r.category);
        out.push({
          documentName: r.documentName,
          category: r.category,
          stage,
          uploaded: Boolean(match) || stage < currentStage,
          fileName: match?.originalName ?? match?.filename ?? undefined,
        });
      });
    });
    return out;
  })();

  const geoTechDocs = (() => {
    const geoCategories = ['geotechnical', 'digital-survey', 'environmental'];
    const allFiles = Object.values(filesByStage).flat();
    const geoFiles = allFiles.filter((f) => geoCategories.includes(f.category));

    const docMap = new Map<string, { name: string; category: string; uploaded: boolean; fileName?: string }>();
    for (const f of geoFiles) {
      const key = f.originalName || f.filename || f.id;
      docMap.set(key, {
        name: f.originalName || f.filename || 'Untitled',
        category: f.category,
        uploaded: true,
        fileName: f.originalName || f.filename,
      });
    }

    const reqs = [
      { name: 'Geotechnical Investigation Report', category: 'geotechnical' },
      { name: 'Digital Survey Data', category: 'digital-survey' },
      { name: 'Environmental Impact Assessment', category: 'environmental' },
    ];
    for (const r of reqs) {
      if (![...docMap.values()].some((d) => d.category === r.category)) {
        docMap.set(r.name, { name: r.name, category: r.category, uploaded: false });
      }
    }
    return [...docMap.values()];
  })();

  const allProjectFiles = Object.values(filesByStage).flat();
  const visibleDocs = isClientTemp
    ? allProjectFiles.filter((f) => f.category !== 'payment-certificate' && f.category !== 'proof-of-payment')
    : allProjectFiles;

  useEffect(() => {
    let cancelled = false;
    async function loadProject() {
      if (!tenantSlug || !id) return;
      setProjectLoading(true);
      try {
        const res = await projectsApi.getById(id);
        if (!cancelled) {
          setProject(res);
          if (res.currentStage) setCurrentStage(res.currentStage);
        }
      } catch {
        // Keep defaults if API unavailable
      } finally {
        if (!cancelled) setProjectLoading(false);
      }
    }
    void loadProject();
    return () => { cancelled = true; };
  }, [tenantSlug, id]);

  useEffect(() => {
    if (!tenantSlug || !id) return;
    apiClient.get(`/${tenantSlug}/projects/${id}/funding-sources`).then(res => {
      const data = res.data?.data || res.data;
      setFundingSources(Array.isArray(data) ? data : data?.fundingSources || []);
    }).catch(() => {});
  }, [tenantSlug, id]);

  useEffect(() => {
    let cancelled = false;

    async function loadStageStatus() {
      if (!tenantSlug || !id) return;
      setIsStageLoading(true);
      try {
        const status = await fetchProjectStageStatus({
          tenantSlug,
          projectId: id,
        });

        if (cancelled) return;

        setCurrentStage(status.currentStage);
        setStageMissingDocs(status.missing);
        setIsStageStatusLoaded(true);
      } catch {
        // Keep currentStage defaults if backend is not wired yet.
        if (cancelled) return;
        setStageMissingDocs([]);
        setIsStageStatusLoaded(false);
      } finally {
        if (cancelled) return;
        setIsStageLoading(false);
      }
    }

    void loadStageStatus();

    return () => {
      cancelled = true;
    };
  }, [tenantSlug, id]);

  useEffect(() => {
    let cancelled = false;
    async function loadFiles() {
      if (!tenantSlug || !id) return;

      // Fetch when user opens the Files tab or opens a stage drawer.
      const shouldFetchAllStages = activeTab === 'Files';
      const targetStages: ProjectStage[] = shouldFetchAllStages
        ? ([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as ProjectStage[])
        : stageDrawerOpen != null
          ? [stageDrawerOpen]
          : [];

      if (targetStages.length === 0) return;

      setIsFilesLoading(true);
      try {
        const next: Partial<Record<ProjectStage, ProjectFile[]>> = {};
        await Promise.all(
          targetStages.map(async (stage) => {
            const res = await filesApi.list({
              tenantSlug,
              projectId: id,
              stage,
              clientVisible: isClientTemp ? true : undefined,
              page: 1,
              pageSize: 200,
            });

            if (cancelled) return;
            next[stage] = res.data;
          })
        );

        if (cancelled) return;
        setFilesByStage((prev) => ({
          ...prev,
          ...next,
        }));
      } catch {
        // Backend may be stubbed early in dev; keep UI functional.
      } finally {
        if (cancelled) return;
        setIsFilesLoading(false);
      }
    }

    void loadFiles();
    return () => {
      cancelled = true;
    };
  }, [activeTab, stageDrawerOpen, tenantSlug, id, isClientTemp]);

  const completedStages: ProjectStage[] = [];

  if (!tenantSlug || !id) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link
          to={`/${tenantSlug}/projects`}
          className="text-[var(--text-muted)] hover:text-[var(--accent-sand)] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-mono">{projectRef}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-h1 mb-1">{projectDisplayName}</h1>
          <StatusBadge status="active">Active</StatusBadge>
        </div>
        <div className="flex items-center gap-3">
          {!isClientTemp && (
            <button
              type="button"
              aria-label={isPinned ? 'Unpin project' : 'Pin project'}
              aria-pressed={isPinned}
              className={[
                'shrink-0 p-2 rounded-sm transition-colors',
                isPinned ? 'text-[var(--accent-sand)] hover:text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--accent-sand)]',
                'hover:bg-[var(--accent-sand-glow)]',
              ].join(' ')}
              onClick={() => {
                if (!tenantSlug) return;
                togglePinnedProject(tenantSlug, { id, name: projectDisplayName, ref: projectRef });
              }}
            >
              <Star className="h-4 w-4" fill={isPinned ? 'currentColor' : 'none'} />
            </button>
          )}
          {canEditProject && (
            <Link to={`/${tenantSlug}/projects/${id}/edit`}>
              <Button variant="secondary">
                <Edit className="h-3.5 w-3.5" />
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-0 border-b border-[var(--border-default)] mb-8 overflow-x-auto">
        {detailTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'text-button px-5 py-3 whitespace-nowrap transition-all duration-300',
              activeTab === tab
                ? 'text-[var(--accent-sand)] border-b-2 border-[var(--accent-sand)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ═══ Overview Tab ═══ */}
      {activeTab === 'Overview' && (
        <div className="space-y-8">
          {/* KPI row + Countdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-0">
            {[
              {
                label: 'Contract Value',
                value: isClientTemp ? '—— Restricted' : formatRands(contractValue),
              },
              {
                label: 'Expenditure',
                value: isClientTemp ? '—— Restricted' : formatRands(expenditure),
              },
              {
                label: 'Balance',
                value: isClientTemp ? '—— Restricted' : formatRands(balance),
              },
              { label: '% Complete', value: `${percentComplete}%` },
            ].map((kpi) => (
              <div key={kpi.label} className="p-5 border border-[var(--border-default)] bg-[var(--bg-surface)]">
                <p className="text-eyebrow mb-2">{kpi.label}</p>
                <p className="text-currency text-[1rem]">{kpi.value}</p>
              </div>
            ))}
            <div className="p-5 border border-[var(--border-default)] bg-[var(--bg-surface)]">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-3 w-3 text-[var(--accent-periwinkle)]" />
                <p className="text-eyebrow">Completion</p>
              </div>
              {countdown.isExpired ? (
                <p className="text-[0.82rem] font-semibold text-[var(--status-success)]">Due</p>
              ) : (
                <p style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-[1rem] font-semibold text-[var(--text-primary)]">
                  {countdown.days}d {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
                </p>
              )}
            </div>
          </div>

          {/* 6-Stage Project Lifecycle Timeline (v6.0) */}
          <StageTimeline
            currentStage={currentStage}
            completedStages={completedStages}
            onStageClick={(stage) => setStageDrawerOpen(stage)}
          />
          {stageDrawerOpen != null && (
            <StageDocumentDrawer
              stage={stageDrawerOpen}
              projectId={id ?? ''}
              documents={
                STAGE_DOCUMENT_REQUIREMENTS[stageDrawerOpen].map((r) => {
                  const isPastStage = stageDrawerOpen < currentStage;
                  const isCurrentStage = stageDrawerOpen === currentStage;
                  const isMissing =
                    isCurrentStage &&
                    stageMissingDocs.some(
                      (m) => m.documentName === r.documentName && m.category === r.category,
                    );

                  const stageFiles = filesByStage[stageDrawerOpen] ?? [];
                  const matchingFiles = stageFiles.filter((f) => f.category === r.category);
                  const firstFileName =
                    matchingFiles[0]?.originalName ?? matchingFiles[0]?.filename ?? undefined;

                  const localKey = `${id}|${stageDrawerOpen}|${r.documentName}|${r.category}`;
                  const localUpload = localStageUploads[localKey];
                  const localUploaded = Boolean(localUpload);
                  const uploaded = isPastStage || (isCurrentStage && (!isMissing || localUploaded));
                  const fileName = uploaded ? localUpload?.fileName ?? firstFileName : undefined;

                  return {
                    documentName: r.documentName,
                    category: r.category,
                    uploaded,
                    fileName,
                  };
                })
              }
              gatePassed={
                stageDrawerOpen < currentStage ||
                (stageDrawerOpen === currentStage &&
                  !isStageLoading &&
                  isStageStatusLoaded &&
                  stageMissingDocs.length === 0)
              }
              onClose={() => setStageDrawerOpen(null)}
              onUploadDocument={
                isClientTemp
                  ? undefined
                  : async ({ documentName, category, file }) => {
                      if (!tenantSlug || !id) return;
                      const stage = stageDrawerOpen;
                      if (!stage) return;

                      const localKey = `${id}|${stage}|${documentName}|${category}`;

                      try {
                        await filesApi.uploadStageDocument({
                          tenantSlug,
                          projectId: id,
                          stage,
                          category,
                          file,
                        });
                      } catch {
                        // Backend may be stubbed/disabled for MVP: keep the drawer functional
                        // by optimistically marking this requirement as uploaded.
                        setLocalStageUploads((prev) => ({
                          ...prev,
                          [localKey]: { fileName: file.name },
                        }));
                        setStageMissingDocs((prev) =>
                          prev.filter(
                            (m) => !(m.documentName === documentName && m.category === category),
                          ),
                        );
                        setIsStageLoading(false);
                        setIsStageStatusLoaded(true);
                        return;
                      }

                      // Reload stage gate status after successful upload.
                      try {
                        const status = await fetchProjectStageStatus({
                          tenantSlug,
                          projectId: id,
                        });
                        setCurrentStage(status.currentStage);
                        setStageMissingDocs(status.missing);
                        setIsStageStatusLoaded(true);
                      } catch {
                        // Ignore; gate UI will refresh on the next stage-status load.
                      }

                      // Reload files for this stage so drawer shows uploaded file names.
                      try {
                        const res = await filesApi.list({
                          tenantSlug,
                          projectId: id,
                          stage,
                          clientVisible: undefined,
                          page: 1,
                          pageSize: 200,
                        });
                        setFilesByStage((prev) => ({
                          ...prev,
                          [stage]: res.data,
                        }));
                      } catch {
                        // Ignore; drawer still reflects gate status via stage-status endpoint.
                      }
                    }
              }
              onAdvanceStage={
                isClientTemp
                  ? undefined
                  : stageDrawerOpen === currentStage
                    ? () => {
                        void (async () => {
                          setIsAdvancing(true);

                          let succeeded = false;
                          try {
                            await advanceProjectStage({
                              tenantSlug,
                              projectId: id,
                            });
                            succeeded = true;
                          } catch (err: unknown) {
                            succeeded = false;
                            if (axios.isAxiosError(err) && err.response?.status === 422) {
                              const body = err.response?.data as {
                                error?: string;
                                missing?: StageMissingDoc[];
                              };
                              const missing = Array.isArray(body?.missing)
                                ? body.missing.filter(
                                    (m): m is StageMissingDoc =>
                                      !!m &&
                                      typeof m === 'object' &&
                                      typeof m.documentName === 'string' &&
                                      typeof m.category === 'string',
                                  )
                                : [];
                              if (missing.length > 0) {
                                setStageMissingDocs(missing);
                              }
                              const label =
                                missing.length > 0
                                  ? missing.map((m) => m.documentName).join(', ')
                                  : 'Required documents';
                              addToast({
                                type: 'error',
                                message:
                                  body?.error === 'STAGE_GATE_FAILED'
                                    ? `Stage gate blocked. Missing: ${label}`
                                    : `Cannot advance stage. ${label}`,
                              });
                            } else {
                              addToast({
                                type: 'error',
                                message: 'Could not advance stage. Try again.',
                              });
                            }
                          }

                          try {
                            const status = await fetchProjectStageStatus({
                              tenantSlug,
                              projectId: id,
                            });
                            setCurrentStage(status.currentStage);
                            setStageMissingDocs(status.missing);
                          } catch {
                            // If stage-status cannot be reloaded, keep current UI state.
                            setIsStageStatusLoaded(false);
                          } finally {
                            setIsAdvancing(false);
                            if (succeeded) setStageDrawerOpen(null);
                          }
                        })();
                      }
                    : undefined
              }
              isAdvancing={isAdvancing}
            />
          )}

          {/* Two-column: Multi-year payment plan + Documents */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Multi-year Payment Plan - enlarged for readability */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] px-6 py-5 w-full">
              <h3 className="text-h3 mb-4">Multi-Year Payment Plan</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-[0.85rem]">
                  <thead>
                    <tr className="bg-[var(--accent-sand)]">
                      <th className="text-left px-4 py-3 text-[var(--text-primary)] font-medium">Year</th>
                      <th className="text-right px-4 py-3 text-[var(--text-primary)] font-medium">Q1</th>
                      <th className="text-right px-4 py-3 text-[var(--text-primary)] font-medium">Q2</th>
                      <th className="text-right px-4 py-3 text-[var(--text-primary)] font-medium">Q3</th>
                      <th className="text-right px-4 py-3 text-[var(--text-primary)] font-medium">Q4</th>
                      <th className="text-right px-4 py-3 text-[var(--text-primary)] font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentPlan.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-[var(--text-muted)] text-[0.85rem]">
                          No payment plan data available.
                        </td>
                      </tr>
                    )}
                    {paymentPlan.map((row, i) => {
                      const total = row.q1 + row.q2 + row.q3 + row.q4;
                      return (
                        <tr
                          key={row.year}
                          className={`border-t border-[var(--border-default)] ${i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-surface-alt)]'}`}
                        >
                          <td className="px-4 py-3 text-[0.85rem] font-medium text-[var(--text-primary)]">{row.year}</td>
                          <td className="px-4 py-3 text-right text-financial text-[0.85rem]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            {isClientTemp ? '—— Restricted' : row.q1 ? formatRands(row.q1) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-right text-financial text-[0.85rem]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            {isClientTemp ? '—— Restricted' : row.q2 ? formatRands(row.q2) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-right text-financial text-[0.85rem]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            {isClientTemp ? '—— Restricted' : row.q3 ? formatRands(row.q3) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-right text-financial text-[0.85rem]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            {isClientTemp ? '—— Restricted' : row.q4 ? formatRands(row.q4) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-right text-financial text-[0.9rem] font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            {isClientTemp ? '—— Restricted' : formatRands(total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {!isClientTemp && (
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart
                      data={paymentPlan.map((row) => ({
                        year: String(row.year),
                        Q1: row.q1,
                        Q2: row.q2,
                        Q3: row.q3,
                        Q4: row.q4,
                      }))}
                      margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                      barCategoryGap="30%"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border-default)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="year"
                        tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-default)',
                          borderRadius: 0,
                          fontSize: 11,
                        }}
                        formatter={(val: number) => formatRands(val)}
                      />
                      <Legend
                        iconSize={8}
                        wrapperStyle={{ fontSize: 10, color: 'var(--text-muted)' }}
                      />
                      <Bar dataKey="Q1" stackId="a" fill="var(--accent)" opacity={0.9} />
                      <Bar dataKey="Q2" stackId="a" fill="var(--ochre)" opacity={0.85} />
                      <Bar dataKey="Q3" stackId="a" fill="var(--sienna)" opacity={0.8} />
                      <Bar dataKey="Q4" stackId="a" fill="var(--gold)" opacity={0.75} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Document Panel */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-6">
              <h3 className="text-h3 mb-4">Project Documents</h3>
              <div className="flex flex-col gap-0">
                {visibleDocs.length === 0 && (
                  <p className="text-body text-[var(--text-muted)] py-4">No documents uploaded yet.</p>
                )}
                {visibleDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between py-3 border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--accent-sand-glow)] transition-colors px-2 -mx-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-[var(--accent-periwinkle)]" />
                      <div>
                        <p className="text-[0.82rem] text-[var(--text-primary)]">{doc.originalName || doc.filename || 'Untitled'}</p>
                        <p className="text-[0.62rem] text-[var(--text-muted)] uppercase tracking-wider">
                          {String(doc.category).replace(/-/g, ' ')}
                        </p>
                      </div>
                    </div>
                    <span className="text-[0.62rem] text-[var(--text-muted)]">{new Date(doc.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                ))}
              </div>
              {!isClientTemp && (
                <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
                  <p className="text-[0.68rem] text-[var(--status-danger)] font-medium">
                    Proof of payment not yet uploaded; required for project completion
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Location + Key Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ProjectLocationMap
              address={project?.location?.address || project?.localMunicipality || 'N/A'}
              lat={project?.location?.lat ?? -25.4753}
              lng={project?.location?.lng ?? 30.9694}
              gpsFormatted={project?.gpsFormatted || (project?.location?.lat != null ? `${project.location.lat}, ${project.location.lng}` : '')}
            />

            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-6">
              <h3 className="text-h3 mb-4">Key Information</h3>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Department', value: (projectRecord?.department as { name: string } | undefined)?.name || 'N/A' },
                  { label: 'Start Date', value: project?.startDate ? new Date(project.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A' },
                  { label: 'Completion Date', value: project?.completionDate ? new Date(project.completionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A' },
                  { label: 'Project Manager', value: (typeof project?.projectManager === 'object' ? (project.projectManager as unknown as { fullName: string })?.fullName : project?.projectManager) || 'N/A' },
                  { label: 'Contractor', value: project?.contractor || 'N/A' },
                  { label: 'Geo-Tec Engineer', value: project?.geoTecEngineer || 'N/A' },
                ].map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between py-2 border-b border-[var(--border-default)]">
                    <span className="text-[0.7rem] text-[var(--text-muted)]">{row.label}</span>
                    <span className="text-[0.82rem] text-[var(--text-primary)]">{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <p className="text-eyebrow mb-3">Progress</p>
                <ProgressBar value={percentComplete} height={4} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Activity Schedule Tab ═══ */}
      {activeTab === 'Activity Schedule' && <ProjectActivitySchedule />}

      {/* Expenditure (legacy) - Payment History */}
      {activeTab === 'Files' && id && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-8">
          <h3 className="text-h3 mb-4">Project Files</h3>
          <p className="text-body mb-6">
            Stage-organised documents. Admin/PM can toggle which uploaded files are marked as client-visible.
          </p>

          {isFilesLoading ? (
            <div className="border border-[var(--border-default)] bg-[var(--bg-surface)] p-6">
              <div className="skeleton h-5 w-56 mb-4" />
              <div className="skeleton h-4 w-full mb-2" />
              <div className="skeleton h-4 w-full mb-2" />
              <div className="skeleton h-4 w-2/3" />
            </div>
          ) : (
            <div className="space-y-6">
              {([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as ProjectStage[]).map((stage) => {
                const stageFiles = filesByStage[stage] ?? [];

                const stageReqs = STAGE_DOCUMENT_REQUIREMENTS[stage];

                return (
                  <div key={stage} className="border border-[var(--border-default)] bg-[var(--bg-surface)]">
                    <div className="px-6 py-4 border-b border-[var(--border-default)]">
                      <h4 className="text-h3 text-[0.98rem]">
                        Stage {stage}: {STAGE_NAMES[stage]}
                      </h4>
                    </div>

                    <div className="p-6">
                      {isClientTemp ? (
                        <>
                          {stageFiles.length === 0 ? (
                            <p className="text-body text-[var(--text-muted)]">
                              No client-visible files available for this stage.
                            </p>
                          ) : (
                            <div className="space-y-4">
                              {stageFiles.map((file) => (
                                <div
                                  key={file.id}
                                  className="flex items-start justify-between gap-4 py-3 border-b border-[var(--border-default)] last:border-0"
                                >
                                  <div className="min-w-0">
                                    <p className="text-[0.85rem] font-medium text-[var(--text-primary)] truncate">
                                      {file.originalName || file.filename || 'Untitled file'}
                                    </p>
                                    <p className="text-[0.65rem] text-[var(--text-muted)] uppercase tracking-wider">
                                      {String(file.category).replace(/-/g, ' ')}
                                    </p>
                                  </div>
                                  <span className="text-[0.62rem] text-[var(--text-muted)]">
                                    {new Date(file.createdAt).toLocaleDateString('en-GB')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="space-y-4">
                          {stageReqs.map((req) => {
                            const matchingFiles = stageFiles.filter((f) => f.category === req.category);
                            const isProofOfPayment = req.category === 'proof-of-payment';

                            return (
                              <div
                                key={`${stage}-${req.category}`}
                                className="py-3 border-b border-[var(--border-default)] last:border-0"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0">
                                    <p className="text-[0.85rem] font-medium text-[var(--text-primary)]">
                                      {req.documentName}
                                    </p>
                                    <p className="text-[0.65rem] text-[var(--text-muted)] uppercase tracking-wider">
                                      {req.category.replace(/-/g, ' ')}
                                    </p>
                                  </div>

                                  <div className="text-right shrink-0">
                                    {matchingFiles.length > 0 ? (
                                      <span className="inline-flex items-center gap-2 text-[0.68rem] font-semibold text-[var(--status-success)]">
                                        <Check className="h-3.5 w-3.5" />
                                        Uploaded
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-2 text-[0.68rem] font-semibold text-[var(--status-danger)]">
                                        <X className="h-3.5 w-3.5" />
                                        Missing
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {matchingFiles.length > 0 && (
                                  <div className="mt-3 space-y-2">
                                    {matchingFiles.map((file) => (
                                      <div key={file.id} className="flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                          <p className="text-[0.78rem] text-[var(--text-primary)] truncate">
                                            {file.originalName || file.filename || 'Untitled file'}
                                          </p>
                                          <p className="text-[0.6rem] text-[var(--text-muted)]">
                                            Uploaded {new Date(file.createdAt).toLocaleDateString('en-GB')}
                                          </p>
                                        </div>
                                        <label className="flex items-center gap-2 shrink-0">
                                          <input
                                            type="checkbox"
                                            checked={file.clientVisible}
                                            disabled={isProofOfPayment}
                                            onChange={async (e) => {
                                              try {
                                                await filesApi.setVisibility({
                                                  tenantSlug,
                                                  fileId: file.id,
                                                  clientVisible: e.target.checked,
                                                });
                                                setFilesByStage((prev) => ({
                                                  ...prev,
                                                  [stage]: prev[stage].map((f) =>
                                                    f.id === file.id ? { ...f, clientVisible: e.target.checked } : f
                                                  ),
                                                }));
                                              } catch {
                                                // Ignore; UI will refresh next fetch.
                                              }
                                            }}
                                          />
                                          <span className="text-[0.7rem] text-[var(--text-muted)]">
                                            Client Visible
                                          </span>
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ Professional Services Tab ═══ */}
      {activeTab === 'Professional Services' && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-6">
          <h3 className="text-h3 mb-4">Stage Documents (Inception → Procurement)</h3>
          <p className="text-body mb-6">
            Checklist of required documents for stages 1–4: scoping, preliminary design, detailed design, and tender documentation.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-[0.85rem]">
              <thead>
                <tr className="bg-[var(--accent-sand)]">
                  <th className="text-left px-4 py-3 text-[var(--text-primary)] font-medium">Stage</th>
                  <th className="text-left px-4 py-3 text-[var(--text-primary)] font-medium">Document</th>
                  <th className="text-left px-4 py-3 text-[var(--text-primary)] font-medium">Category</th>
                  <th className="text-center px-4 py-3 text-[var(--text-primary)] font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {profServicesDocs.map((doc, i) => (
                  <tr
                    key={`${doc.stage}-${doc.documentName}`}
                    className={`border-t border-[var(--border-default)] ${i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-surface-alt)]'}`}
                  >
                    <td className="px-4 py-3 text-[var(--text-primary)]">{doc.stage}</td>
                    <td className="px-4 py-3 text-[var(--text-primary)]">{doc.documentName}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {doc.category.replace(/-/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {doc.uploaded ? (
                        <span className="inline-flex items-center gap-1 text-[var(--status-success)]">
                          <Check className="h-3.5 w-3.5" />
                          Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[var(--status-danger)]">
                          <X className="h-3.5 w-3.5" />
                          Missing
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ Geo-Technical Tab ═══ */}
      {activeTab === 'Geo-Technical' && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-6">
          <h3 className="text-h3 mb-4">Geo-Technical & Survey Documents</h3>
          <p className="text-body mb-6">
            Geotechnical reports, digital surveys, and environmental assessments required for site works.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-[0.85rem]">
              <thead>
                <tr className="bg-[var(--accent-sand)]">
                  <th className="text-left px-4 py-3 text-[var(--text-primary)] font-medium">Document</th>
                  <th className="text-left px-4 py-3 text-[var(--text-primary)] font-medium">Category</th>
                  <th className="text-center px-4 py-3 text-[var(--text-primary)] font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {geoTechDocs.map((doc, i) => (
                  <tr
                    key={doc.name}
                    className={`border-t border-[var(--border-default)] ${i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-surface-alt)]'}`}
                  >
                    <td className="px-4 py-3 text-[var(--text-primary)]">{doc.name}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {doc.category.replace(/-/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {doc.uploaded ? (
                        <span className="inline-flex items-center gap-1 text-[var(--status-success)]">
                          <Check className="h-3.5 w-3.5" />
                          Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[var(--status-danger)]">
                          <X className="h-3.5 w-3.5" />
                          Missing
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ Construction Tab ═══ */}
      {activeTab === 'Construction' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: 'Contract Value',
                value: isClientTemp ? '—— Restricted' : formatRands(contractValue),
              },
              {
                label: 'Paid to Date',
                value: isClientTemp ? '—— Restricted' : formatRands(expenditure),
              },
              {
                label: 'Remaining',
                value: isClientTemp ? '—— Restricted' : formatRands(balance),
              },
            ].map((kpi) => (
              <div key={kpi.label} className="p-5 border border-[var(--border-default)] bg-[var(--bg-surface)]">
                <p className="text-eyebrow mb-2">{kpi.label}</p>
                <p className="text-currency text-[1rem]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>
          {isClientTemp ? (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-6">
              <h3 className="text-h3 mb-2">Expected vs Actual Payments</h3>
              <p className="text-body text-[var(--text-muted)]">—— Restricted</p>
            </div>
          ) : (
            <PaymentForecastChart
              forecastData={forecastMonthly}
              actualData={actualMonthly}
              title="Expected vs Actual Payments"
              height={320}
            />
          )}

          {!isClientTemp && id && (
            <ProjectPaymentHistory projectId={id} />
          )}
        </div>
      )}

      {/* ═══ Funding Sources Tab ═══ */}
      {activeTab === 'Funding Sources' && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-6">
          <h3 className="text-h3 mb-4">Funding Sources</h3>
          <p className="text-body mb-6">
            MIG, WSIG, provincial budget, and other funding allocations with disbursed and remaining amounts.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-[0.85rem]">
              <thead>
                <tr className="bg-[var(--accent-sand)]">
                  <th className="text-left px-4 py-3 text-[var(--text-primary)] font-medium">Source</th>
                  <th className="text-right px-4 py-3 text-[var(--text-primary)] font-medium">Total</th>
                  <th className="text-right px-4 py-3 text-[var(--text-primary)] font-medium">Disbursed</th>
                  <th className="text-right px-4 py-3 text-[var(--text-primary)] font-medium">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {fundingSources.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-[var(--text-muted)] text-[0.85rem]">
                      No funding sources available.
                    </td>
                  </tr>
                )}
                {fundingSources.map((row, i) => {
                  const rowId = String(row.id ?? row._id ?? i);
                  const rowName = String(row.sourceName || row.name || row.source || 'N/A');
                  const rowTotal = Number(row.total || row.amount || 0);
                  const rowDisbursed = Number(row.disbursed || 0);
                  const rowRemaining = row.remaining != null ? Number(row.remaining) : rowTotal - rowDisbursed;
                  return (
                  <tr
                    key={rowId}
                    className={`border-t border-[var(--border-default)] ${i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-surface-alt)]'}`}
                  >
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{rowName}</td>
                    <td className="px-4 py-3 text-right text-financial" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {isClientTemp ? '—— Restricted' : formatRands(rowTotal)}
                    </td>
                    <td className="px-4 py-3 text-right text-financial" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {isClientTemp ? '—— Restricted' : formatRands(rowDisbursed)}
                    </td>
                    <td className="px-4 py-3 text-right text-financial" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {isClientTemp ? '—— Restricted' : formatRands(rowRemaining)}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
