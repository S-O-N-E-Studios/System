import { useState, useEffect } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
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
import StageDocumentDrawer from '@/components/ui/StageDocumentDrawer';
import PaymentForecastChart from '@/components/ui/PaymentForecastChart';
import ApprovalStatusBadge from '@/components/ui/ApprovalStatusBadge';
import VariationOrderDrawer from '@/components/ui/VariationOrderDrawer';
import MediaGallery from '@/components/ui/MediaGallery';
import { formatRands } from '@/utils/formatters';
import { progressFromLifecycleStage } from '@/utils/lifecycleProgress';
import { ArrowLeft, Edit, FileText, Clock, Check, X, Star } from 'lucide-react';
import ProjectActivitySchedule from './ProjectActivitySchedule';
import ProjectPaymentHistory from './ProjectPaymentHistory';
import ProjectWorkflow from './ProjectWorkflow';
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
  type StageRequiredDoc,
  type StageMissingDoc,
} from '@/api/projectStage';
import { filesApi } from '@/api/files';
import { projectsApi } from '@/api/projects';
import apiClient from '@/api/client';
import { stageApprovalsApi } from '@/api/stageApprovals';
import { variationsApi } from '@/api/variations';
import { mediaApi } from '@/api/media';
import { workflowApi } from '@/api/workflow';
import type { ApprovalStatus, StageApproval, VariationOrder } from '@/types';
import {
  TABLE_CELL,
  TABLE_HEAD_CELL,
  TABLE_HEAD_ROW,
  TABLE_ROW_BASE,
  TABLE_SURFACE,
} from '@/utils/tableStyles';

const detailTabs = [
  'Overview',
  'Workflow',
  'Gantt Chart',
  'Construction Ops',
  'Finance',
  'Evidence',
  'Audit Trail',
] as const;

const TOP_LEVEL_STAGES = [
  { id: 1, label: 'Initiation' },
  { id: 2, label: 'Project Planning' },
  { id: 3, label: 'Project Execution' },
  { id: 4, label: 'Monitoring and Control' },
  { id: 5, label: 'Closure' },
] as const;

const AUDIT_PRESETS = [
  { id: 'all', label: 'All', action: '', overrideOnly: false },
  { id: 'approvals', label: 'Approvals', action: 'document.approved', overrideOnly: false },
  { id: 'workflow', label: 'Workflow Gates', action: 'workflow.advanced', overrideOnly: false },
  { id: 'overrides', label: 'Overrides', action: '', overrideOnly: true },
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

function entityId<T extends { id?: string; _id?: string }>(entity: T | null | undefined): string {
  if (!entity) return '';
  return entity.id || entity._id || '';
}

function currentBillingPeriod(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
}

function centsToRands(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n / 100 : 0;
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
  const [stageRequiredDocs, setStageRequiredDocs] = useState<StageRequiredDoc[]>([]);
  const [stageRequirementsMap, setStageRequirementsMap] = useState<Record<string, StageRequiredDoc[]>>({});
  const [stage7Readiness, setStage7Readiness] = useState<{
    periods: Array<{
      period: string;
      progressReportPresent: boolean;
      safetyReportPresent: boolean;
      cashFlowPresent: boolean;
      paymentCertificateCount: number;
      evidenceImageCount: number;
      reportingComplete: boolean;
      evidenceMinimum: number;
      evidenceSufficient: boolean;
    }>;
    pendingVariationCount: number;
  } | null>(null);
  const [activitiesMissingImages, setActivitiesMissingImages] = useState<Array<{
    activityId: string;
    name: string;
    imageCount: number;
    required: number;
  }>>([]);
  const [isStageLoading, setIsStageLoading] = useState(false);
  const [isStageStatusLoaded, setIsStageStatusLoaded] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const { user } = useAuthStore();
  const { addToast } = useUiStore();
  const tenantRole =
    user && tenantSlug ? user.tenants.find((t) => t.slug === tenantSlug)?.role : undefined;
  const isClientTemp = tenantRole === 'CLIENT_TEMP';
  const can = useCan();
  const canEditProject = can('edit_project');
  const canCreateVariation = can('create_variation_order');
  const canUploadMedia = can('upload_media');
  const canApproveDocuments = Boolean(user?.canApproveDocuments) || can('approve_documents');
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
  const [approvals, setApprovals] = useState<StageApproval[]>([]);
  const [, setIsApprovalsLoading] = useState(false);
  const [variations, setVariations] = useState<VariationOrder[]>([]);
  const [isVariationDrawerOpen, setIsVariationDrawerOpen] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<VariationOrder | null>(null);
  const [mediaItems, setMediaItems] = useState<ProjectFile[]>([]);
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditOverrideOnly, setAuditOverrideOnly] = useState(false);
  const [auditDateFrom, setAuditDateFrom] = useState('');
  const [auditDateTo, setAuditDateTo] = useState('');
  const [auditPage, setAuditPage] = useState(1);

  const contractValue = centsToRands(
    project?.contractValueAdjusted ?? project?.contractValueOriginal ?? project?.contractValue ?? 0
  );
  const expenditure = centsToRands(project?.expenditureToDate ?? 0);
  const balance =
    project?.balance != null ? centsToRands(project.balance) : (contractValue - expenditure);
  const percentComplete =
    project?.percentComplete ?? progressFromLifecycleStage(currentStage);
  const topLevelStage = Number(project?.stageTopLevel || 1);

  const projectRecord = project as (Project & Record<string, unknown>) | null;
  const paymentPlan: { year: number; q1: number; q2: number; q3: number; q4: number }[] =
    (projectRecord?.paymentPlan as { year: number; q1: number; q2: number; q3: number; q4: number }[]) || [];
  const paymentPlanTotals = paymentPlan.map((row) => ({
    year: row.year,
    total: row.q1 + row.q2 + row.q3 + row.q4,
  }));
  const paymentPlanGrandTotal = paymentPlanTotals.reduce((sum, row) => sum + row.total, 0);
  const forecastMonthly: { month: string; amount: number }[] =
    (projectRecord?.paymentForecast as { month: string; amount: number }[]) || [];
  const actualMonthly: { month: string; amount: number }[] =
    (projectRecord?.paymentActual as { month: string; amount: number }[]) || [];

  const allProjectFiles = Object.values(filesByStage).flat();
  const visibleDocs = isClientTemp
    ? allProjectFiles.filter((f) => f.category !== 'payment-certificate' && f.category !== 'proof-of-payment')
    : allProjectFiles;
  const stage7BlockingPeriods = (stage7Readiness?.periods || []).filter(
    (row) => !row.reportingComplete || !row.evidenceSufficient || row.paymentCertificateCount === 0,
  );
  const stage7AdvanceWarning =
    currentStage === 7 && stage7Readiness
      ? [
          stage7BlockingPeriods.length > 0
            ? `${stage7BlockingPeriods.length} billing period(s) still blocked`
            : '',
          stage7Readiness.pendingVariationCount > 0
            ? `${stage7Readiness.pendingVariationCount} variation order(s) pending approval`
            : '',
        ]
          .filter(Boolean)
          .join('; ')
      : '';
  const auditQuery = useQuery({
    queryKey: ['project-detail-audit', id, auditActionFilter, auditOverrideOnly, auditDateFrom, auditDateTo, auditPage],
    queryFn: () =>
      workflowApi.listAuditLog(id || '', {
        limit: 15,
        page: auditPage,
        action: auditActionFilter || undefined,
        overrideOnly: auditOverrideOnly || undefined,
        dateFrom: auditDateFrom || undefined,
        dateTo: auditDateTo || undefined,
      }),
    enabled: Boolean(id) && activeTab === 'Audit Trail',
  });
  const auditEntries = auditQuery.data?.entries || [];
  const workflowSummaryQuery = useQuery({
    queryKey: ['project-detail-workflow-summary', id],
    queryFn: () => workflowApi.getWorkflow(id || ''),
    enabled: Boolean(id),
  });
  const effectiveTopLevelStage = Number(workflowSummaryQuery.data?.stageTopLevel || topLevelStage);

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
        setStageRequiredDocs(status.requiredDocuments);
        setStageRequirementsMap(status.stageRequirements || {});
        setStage7Readiness(status.stage7Readiness || null);
        setActivitiesMissingImages(status.activitiesMissingImages || []);
        setIsStageStatusLoaded(true);
      } catch {
        // Keep currentStage defaults if backend is not wired yet.
        if (cancelled) return;
        setStageMissingDocs([]);
        setStageRequiredDocs([]);
        setStageRequirementsMap({});
        setStage7Readiness(null);
        setActivitiesMissingImages([]);
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

      // Fetch when user opens the Evidence tab or opens a stage drawer.
      const shouldFetchAllStages = activeTab === 'Evidence';
      let targetStages: ProjectStage[] = [];
      if (shouldFetchAllStages) {
        targetStages = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as ProjectStage[];
      } else if (activeTab === 'Construction Ops') {
        targetStages = [7] as ProjectStage[];
      } else if (stageDrawerOpen != null) {
        targetStages = [stageDrawerOpen];
      }

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
              pageSize: 100,
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

  useEffect(() => {
    let cancelled = false;
    async function loadApprovals() {
      if (!id) return;
      if (!(activeTab === 'Evidence' || stageDrawerOpen != null)) return;
      setIsApprovalsLoading(true);
      try {
        const list = await stageApprovalsApi.list(id);
        if (!cancelled) setApprovals(list);
      } catch {
        if (!cancelled) setApprovals([]);
      } finally {
        if (!cancelled) setIsApprovalsLoading(false);
      }
    }
    void loadApprovals();
    return () => {
      cancelled = true;
    };
  }, [id, activeTab, stageDrawerOpen]);

  useEffect(() => {
    let cancelled = false;
    async function loadVariations() {
      if (!id || activeTab !== 'Finance') return;
      try {
        const list = await variationsApi.list(id);
        if (!cancelled) setVariations(list);
      } catch {
        if (!cancelled) setVariations([]);
      }
    }
    void loadVariations();
    return () => {
      cancelled = true;
    };
  }, [id, activeTab]);

  useEffect(() => {
    let cancelled = false;
    async function loadMedia() {
      if (!id || activeTab !== 'Evidence') return;
      setIsMediaLoading(true);
      try {
        const payload = await mediaApi.list(id, { page: 1, limit: 100 });
        if (!cancelled) setMediaItems(payload.media);
      } catch {
        if (!cancelled) setMediaItems([]);
      } finally {
        if (!cancelled) setIsMediaLoading(false);
      }
    }
    void loadMedia();
    return () => {
      cancelled = true;
    };
  }, [id, activeTab]);

  const approvalForFile = (fileId?: string) =>
    approvals.find((a) => entityId(a as StageApproval & { _id?: string }) === fileId || a.fileId === fileId);

  const reloadApprovals = async () => {
    if (!id) return;
    try {
      const list = await stageApprovalsApi.list(id);
      setApprovals(list);
    } catch {
      // Ignore approval refresh errors.
    }
  };

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

          <div className="border border-[var(--border-default)] bg-[var(--bg-surface)] p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-h3">Workflow Progress</h3>
                <p className="text-body text-[var(--text-muted)]">
                  Primary project workflow is tracked across 5 top-level stages.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setActiveTab('Workflow')}
              >
                Open Workflow
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {TOP_LEVEL_STAGES.map((stage) => {
                const isActive = stage.id === effectiveTopLevelStage;
                const isDone = stage.id < effectiveTopLevelStage;
                return (
                  <div
                    key={stage.id}
                    className={[
                      'border px-3 py-4',
                      isActive
                        ? 'border-[var(--accent-sand)] bg-[var(--accent-sand-glow)]'
                        : isDone
                          ? 'border-[var(--status-success)] bg-[var(--bg-surface-alt)]'
                          : 'border-[var(--border-default)] bg-[var(--bg-surface)]',
                    ].join(' ')}
                  >
                    <p className="text-[0.62rem] uppercase tracking-[0.12em] text-[var(--text-muted)] mb-1">
                      Stage {stage.id}
                    </p>
                    <p className="text-[0.82rem] text-[var(--text-primary)]">{stage.label}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--border-default)] flex items-center justify-between gap-3">
              <p className="text-[0.72rem] text-[var(--text-muted)]">
                Legacy 0-10 stage drawer remains available during migration.
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStageDrawerOpen(currentStage)}
              >
                Open Legacy Stage Drawer
              </Button>
            </div>
          </div>
          {stageDrawerOpen != null && (
            <StageDocumentDrawer
              stage={stageDrawerOpen}
              projectId={id ?? ''}
              requirements={
                stageDrawerOpen === currentStage && stageRequiredDocs.length > 0
                  ? stageRequiredDocs
                  : stageRequirementsMap[String(stageDrawerOpen)] || STAGE_DOCUMENT_REQUIREMENTS[stageDrawerOpen]
              }
              documents={
                (
                  stageDrawerOpen === currentStage && stageRequiredDocs.length > 0
                    ? stageRequiredDocs
                    : stageRequirementsMap[String(stageDrawerOpen)] || STAGE_DOCUMENT_REQUIREMENTS[stageDrawerOpen]
                ).map((r) => {
                  const isPastStage = stageDrawerOpen < currentStage;
                  const isCurrentStage = stageDrawerOpen === currentStage;
                  const isMissing =
                    isCurrentStage &&
                    stageMissingDocs.some(
                      (m) => m.documentName === r.documentName && m.category === r.category,
                    );

                  const stageFiles = filesByStage[stageDrawerOpen] ?? [];
                  const matchingFiles = stageFiles.filter((f) => f.category === r.category);
                  const firstFile = matchingFiles[0];
                  const firstFileName =
                    firstFile?.originalName ?? firstFile?.filename ?? undefined;
                  const firstFileId = entityId(firstFile as ProjectFile & { _id?: string });
                  const fileApprovalStatus =
                    (firstFile?.approvalStatus as ApprovalStatus | undefined) ||
                    approvalForFile(firstFileId)?.approvalStatus ||
                    'not_required';
                  const fileApproval = approvalForFile(firstFileId);

                  const uploaded = isPastStage || (isCurrentStage && !isMissing);
                  const fileName = uploaded ? firstFileName : undefined;

                  return {
                    documentName: r.documentName,
                    category: r.category,
                    uploaded,
                    fileId: firstFileId || undefined,
                    fileName,
                    approvalStatus: fileApprovalStatus,
                    notificationSentAt: fileApproval?.notificationSentAt,
                    notificationSentCount: fileApproval?.notificationSentCount,
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
                      if (stage == null) return;

                      try {
                        const billingPeriod = stage === 7 ? currentBillingPeriod() : undefined;
                        await filesApi.uploadStageDocument({
                          tenantSlug,
                          projectId: id,
                          stage,
                          billingPeriod,
                          category,
                          file,
                        });
                      } catch {
                        addToast({
                          type: 'error',
                          message: `Could not upload ${documentName}.`,
                        });
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
                        setStageRequiredDocs(status.requiredDocuments);
                        setStageRequirementsMap(status.stageRequirements || {});
                        setStage7Readiness(status.stage7Readiness || null);
                        setActivitiesMissingImages(status.activitiesMissingImages || []);
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
                          pageSize: 100,
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
              canApproveDocuments={canApproveDocuments}
              onApproveDocument={async (fileId) => {
                if (!id) return;
                const approval = approvals.find((a) => a.fileId === fileId);
                const approvalId = entityId(approval as StageApproval & { _id?: string });
                if (!approvalId) return;
                await stageApprovalsApi.approve(id, approvalId);
                await Promise.all([reloadApprovals(), fetchProjectStageStatus({ tenantSlug, projectId: id }).then((status) => {
                  setCurrentStage(status.currentStage);
                  setStageMissingDocs(status.missing);
                  setStageRequiredDocs(status.requiredDocuments);
                  setStageRequirementsMap(status.stageRequirements || {});
                  setStage7Readiness(status.stage7Readiness || null);
                  setActivitiesMissingImages(status.activitiesMissingImages || []);
                }).catch(() => undefined)]);
              }}
              onRejectDocument={async (fileId, reason) => {
                if (!id) return;
                const approval = approvals.find((a) => a.fileId === fileId);
                const approvalId = entityId(approval as StageApproval & { _id?: string });
                if (!approvalId) return;
                await stageApprovalsApi.reject(id, approvalId, reason);
                await Promise.all([reloadApprovals(), fetchProjectStageStatus({ tenantSlug, projectId: id }).then((status) => {
                  setCurrentStage(status.currentStage);
                  setStageMissingDocs(status.missing);
                  setStageRequiredDocs(status.requiredDocuments);
                  setStageRequirementsMap(status.stageRequirements || {});
                  setStage7Readiness(status.stage7Readiness || null);
                  setActivitiesMissingImages(status.activitiesMissingImages || []);
                }).catch(() => undefined)]);
              }}
              onNotifyClient={async (fileId) => {
                if (!id) return;
                const approval = approvals.find((a) => a.fileId === fileId);
                const approvalId = entityId(approval as StageApproval & { _id?: string });
                if (!approvalId) return;
                await stageApprovalsApi.notifyClient(id, approvalId);
                await reloadApprovals();
              }}
              onAdvanceStage={
                isClientTemp
                  ? undefined
                  : stageDrawerOpen === currentStage
                    ? () => {
                        void (async () => {
                          if (stage7AdvanceWarning) {
                            const proceed = window.confirm(
                              `Stage 7 still has unresolved checks: ${stage7AdvanceWarning}. Continue advancing anyway?`,
                            );
                            if (!proceed) return;
                          }
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
                                activitiesMissingImages?: Array<{
                                  activityId: string;
                                  name: string;
                                  imageCount: number;
                                  required: number;
                                }>;
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
                              const missingActivityImages = Array.isArray(body?.activitiesMissingImages)
                                ? body.activitiesMissingImages
                                : [];
                              if (missing.length > 0) {
                                setStageMissingDocs(missing);
                              }
                              setActivitiesMissingImages(missingActivityImages);
                              const label =
                                missing.length > 0
                                  ? missing.map((m) => m.documentName).join(', ')
                                  : 'Required documents';
                              const activityLabel =
                                missingActivityImages.length > 0
                                  ? `; ${missingActivityImages.length} completed activit${missingActivityImages.length === 1 ? 'y is' : 'ies are'} below minimum images`
                                  : '';
                              addToast({
                                type: 'error',
                                message:
                                  body?.error === 'STAGE_GATE_FAILED'
                                    ? `Stage gate blocked. Missing: ${label}${activityLabel}`
                                    : `Cannot advance stage. ${label}${activityLabel}`,
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
                            setStageRequiredDocs(status.requiredDocuments);
                            setStageRequirementsMap(status.stageRequirements || {});
                            setStage7Readiness(status.stage7Readiness || null);
                            setActivitiesMissingImages(status.activitiesMissingImages || []);
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
              <div className={TABLE_SURFACE}>
                <table className="min-w-full text-[0.85rem]">
                  <thead>
                    <tr className={TABLE_HEAD_ROW}>
                      <th className={`${TABLE_HEAD_CELL} font-medium`}>Year</th>
                      <th className={`${TABLE_HEAD_CELL} text-right font-medium`}>Q1</th>
                      <th className={`${TABLE_HEAD_CELL} text-right font-medium`}>Q2</th>
                      <th className={`${TABLE_HEAD_CELL} text-right font-medium`}>Q3</th>
                      <th className={`${TABLE_HEAD_CELL} text-right font-medium`}>Q4</th>
                      <th className={`${TABLE_HEAD_CELL} text-right font-medium`}>Total</th>
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
                          className={`${TABLE_ROW_BASE} ${i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-surface-alt)]'}`}
                        >
                          <td className={`${TABLE_CELL} text-[0.85rem] font-medium text-[var(--text-primary)]`}>{row.year}</td>
                          <td className={`${TABLE_CELL} text-right text-financial text-[0.85rem]`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            {isClientTemp ? '—— Restricted' : row.q1 ? formatRands(row.q1) : 'N/A'}
                          </td>
                          <td className={`${TABLE_CELL} text-right text-financial text-[0.85rem]`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            {isClientTemp ? '—— Restricted' : row.q2 ? formatRands(row.q2) : 'N/A'}
                          </td>
                          <td className={`${TABLE_CELL} text-right text-financial text-[0.85rem]`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            {isClientTemp ? '—— Restricted' : row.q3 ? formatRands(row.q3) : 'N/A'}
                          </td>
                          <td className={`${TABLE_CELL} text-right text-financial text-[0.85rem]`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            {isClientTemp ? '—— Restricted' : row.q4 ? formatRands(row.q4) : 'N/A'}
                          </td>
                          <td className={`${TABLE_CELL} text-right text-financial text-[0.9rem] font-semibold`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
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

          {/* Key info + planning summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--border-default)] p-6">
              <h3 className="text-h3 mb-4">Key Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                {[
                  { label: 'Department', value: (projectRecord?.department as { name: string } | undefined)?.name || 'N/A' },
                  { label: 'Start Date', value: project?.startDate ? new Date(project.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A' },
                  { label: 'Completion Date', value: project?.completionDate ? new Date(project.completionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A' },
                  { label: 'Project Manager', value: (typeof project?.projectManager === 'object' ? (project.projectManager as unknown as { fullName: string })?.fullName : project?.projectManager) || 'N/A' },
                  { label: 'Contractor', value: project?.contractor || 'N/A' },
                  { label: 'Geo-Tec Engineer', value: project?.geoTecEngineer || 'N/A' },
                  { label: 'Duration Type', value: project?.projectDurationType === 'multi_year' ? 'Multi-year' : 'One-year' },
                  { label: 'Linked Plan', value: project?.linkedMultiYearPlanId ? project.linkedMultiYearPlanId : 'N/A' },
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
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-6">
              <h3 className="text-h3 mb-4">Multi-Year Planning</h3>
              <div className="space-y-3">
                <div className="border border-[var(--border-default)] p-3 bg-[var(--bg-surface-alt)]">
                  <p className="text-[0.65rem] text-[var(--text-muted)] uppercase tracking-wider">Plan Horizon</p>
                  <p className="text-[0.88rem] text-[var(--text-primary)]">
                    {paymentPlanTotals.length > 0 ? `${paymentPlanTotals.length} year(s)` : 'Not captured'}
                  </p>
                </div>
                <div className="border border-[var(--border-default)] p-3 bg-[var(--bg-surface-alt)]">
                  <p className="text-[0.65rem] text-[var(--text-muted)] uppercase tracking-wider">Planned Total</p>
                  <p className="text-[0.88rem] text-[var(--text-primary)]">
                    {isClientTemp ? '—— Restricted' : formatRands(paymentPlanGrandTotal)}
                  </p>
                </div>
                <div className="border border-[var(--border-default)] p-3 bg-[var(--bg-surface-alt)]">
                  <p className="text-[0.65rem] text-[var(--text-muted)] uppercase tracking-wider">Annual Totals</p>
                  {paymentPlanTotals.length === 0 ? (
                    <p className="text-[0.75rem] text-[var(--text-muted)] mt-1">No annual values captured yet.</p>
                  ) : (
                    <div className="mt-1 space-y-1">
                      {paymentPlanTotals.slice(0, 4).map((row) => (
                        <p key={row.year} className="text-[0.75rem] text-[var(--text-primary)] flex items-center justify-between">
                          <span>{row.year}</span>
                          <span>{isClientTemp ? '—— Restricted' : formatRands(row.total)}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Workflow' && (
        <ProjectWorkflow projectId={id} />
      )}

      {activeTab === 'Gantt Chart' && (
        <ProjectActivitySchedule />
      )}

      {/* ═══ Construction Ops Tab ═══ */}
      {activeTab === 'Construction Ops' && (
        <div className="space-y-8">
          <div className="space-y-8">
            {stage7Readiness && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-6">
                <h3 className="text-h3 mb-2">Stage 7 Billing Readiness</h3>
                <p className="text-body mb-4">
                  Monthly reporting and evidence checks used during payment certificate review.
                </p>
                <div className="mb-4 rounded border border-[var(--border-default)] bg-[var(--bg-surface-alt)] px-3 py-2 text-[0.75rem] text-[var(--text-muted)]">
                  Stage 7 uploads are auto-tagged with the current billing period (`YYYY-MM`).
                </div>
                {(stage7Readiness.pendingVariationCount > 0 || stage7BlockingPeriods.length > 0) && (
                  <div className="mb-4 rounded border border-[var(--status-review)] bg-[var(--accent-sand)] px-3 py-2 text-[0.75rem] text-[var(--status-review)]">
                    {stage7BlockingPeriods.length > 0 && (
                      <span>{stage7BlockingPeriods.length} billing period(s) are blocked for approval checks. </span>
                    )}
                    {stage7Readiness.pendingVariationCount > 0 && (
                      <span>{stage7Readiness.pendingVariationCount} variation order(s) pending approval.</span>
                    )}
                  </div>
                )}
                {activitiesMissingImages.length > 0 && (
                  <div className="mb-4 rounded border border-[var(--status-danger)] bg-[var(--bg-surface-alt)] px-3 py-2 text-[0.75rem] text-[var(--status-danger)]">
                    {activitiesMissingImages.length} completed activit{activitiesMissingImages.length === 1 ? 'y is' : 'ies are'} below minimum image evidence.
                  </div>
                )}
                <div className={TABLE_SURFACE}>
                  <table className="min-w-full text-[0.78rem]">
                    <thead>
                      <tr className={TABLE_HEAD_ROW}>
                        <th className={TABLE_HEAD_CELL}>Period</th>
                        <th className={TABLE_HEAD_CELL}>Progress</th>
                        <th className={TABLE_HEAD_CELL}>Safety</th>
                        <th className={TABLE_HEAD_CELL}>Cash Flow</th>
                        <th className={TABLE_HEAD_CELL}>Images</th>
                        <th className={TABLE_HEAD_CELL}>Certificates</th>
                        <th className={TABLE_HEAD_CELL}>Readiness</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stage7Readiness.periods.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-3 py-3 text-[var(--text-muted)]">
                            No Stage 7 billing periods captured yet.
                          </td>
                        </tr>
                      )}
                      {stage7Readiness.periods.map((row) => (
                        <tr key={row.period} className={TABLE_ROW_BASE}>
                          <td className={TABLE_CELL}>{row.period}</td>
                          <td className={TABLE_CELL}>{row.progressReportPresent ? 'Yes' : 'No'}</td>
                          <td className={TABLE_CELL}>{row.safetyReportPresent ? 'Yes' : 'No'}</td>
                          <td className={TABLE_CELL}>{row.cashFlowPresent ? 'Yes' : 'No'}</td>
                          <td className={TABLE_CELL}>
                            {row.evidenceImageCount}/{row.evidenceMinimum}
                          </td>
                          <td className={TABLE_CELL}>{row.paymentCertificateCount}</td>
                          <td className={TABLE_CELL}>
                            {row.reportingComplete && row.evidenceSufficient && row.paymentCertificateCount > 0
                              ? 'Ready'
                              : 'Blocked'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Evidence Tab ═══ */}
      {activeTab === 'Evidence' && id && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-8">
          <h3 className="text-h3 mb-4">Evidence</h3>
          <p className="text-body mb-6">
            Stage-organised documents and site media evidence for reviews, approvals, and auditability.
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

                const stageReqs = stageRequirementsMap[String(stage)] || STAGE_DOCUMENT_REQUIREMENTS[stage];
                const stageReqGroups = stageReqs.reduce<Record<string, typeof stageReqs>>((acc, req) => {
                  const group = req.group || 'Required Documents';
                  if (!acc[group]) acc[group] = [];
                  acc[group].push(req);
                  return acc;
                }, {});

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
                          {Object.entries(stageReqGroups).map(([groupName, groupReqs]) => (
                            <div key={`${stage}-${groupName}`} className="border border-[var(--border-default)] bg-[var(--bg-primary)]">
                              <div className="px-3 py-2 border-b border-[var(--border-default)]">
                                <p className="text-eyebrow">{groupName}</p>
                              </div>
                              <div className="px-3 py-2 space-y-4">
                                {groupReqs.map((req) => {
                                  const matchingFiles = stageFiles.filter((f) => f.category === req.category);
                                  const isProofOfPayment = req.category === 'proof-of-payment';

                                  return (
                                    <div
                                      key={`${stage}-${groupName}-${req.category}`}
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
                                            <div key={entityId(file as ProjectFile & { _id?: string })} className="flex items-center justify-between gap-4">
                                              <div className="min-w-0">
                                                <p className="text-[0.78rem] text-[var(--text-primary)] truncate">
                                                  {file.originalName || file.filename || 'Untitled file'}
                                                </p>
                                                <p className="text-[0.6rem] text-[var(--text-muted)]">
                                                  Uploaded {new Date(file.createdAt).toLocaleDateString('en-GB')}
                                                </p>
                                                <div className="mt-1">
                                                  <ApprovalStatusBadge status={file.approvalStatus || 'not_required'} />
                                                </div>
                                              </div>
                                              <div className="flex flex-col items-end gap-2 shrink-0">
                                                <label className="flex items-center gap-2 shrink-0">
                                                  <input
                                                    type="checkbox"
                                                    checked={file.clientVisible}
                                                    disabled={isProofOfPayment}
                                                    onChange={async (e) => {
                                                      try {
                                                        await filesApi.setVisibility({
                                                          tenantSlug,
                                                          fileId: entityId(file as ProjectFile & { _id?: string }),
                                                          clientVisible: e.target.checked,
                                                        });
                                                        setFilesByStage((prev) => ({
                                                          ...prev,
                                                          [stage]: prev[stage].map((f) =>
                                                            entityId(f as ProjectFile & { _id?: string }) === entityId(file as ProjectFile & { _id?: string })
                                                              ? { ...f, clientVisible: e.target.checked }
                                                              : f
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
                                                {canApproveDocuments && file.approvalStatus === 'pending' && (
                                                  <div className="flex items-center gap-2">
                                                    <Button
                                                      variant="secondary"
                                                      className="!py-1 !px-2 text-[11px]"
                                                      onClick={async () => {
                                                        const approval = approvals.find(
                                                          (a) => a.fileId === entityId(file as ProjectFile & { _id?: string }),
                                                        );
                                                        const approvalId = entityId(approval as StageApproval & { _id?: string });
                                                        if (!approvalId || !id) return;
                                                        await stageApprovalsApi.approve(id, approvalId);
                                                        await reloadApprovals();
                                                      }}
                                                    >
                                                      Approve
                                                    </Button>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8 border-t border-[var(--border-default)] pt-6">
            <h4 className="text-h3 mb-3">Site Media</h4>
            {isMediaLoading ? (
              <p className="text-sm text-[var(--text-muted)]">Loading media...</p>
            ) : (
              <MediaGallery
                media={mediaItems}
                canUpload={!isClientTemp && canUploadMedia}
                canDelete={!isClientTemp && canUploadMedia}
                onUpload={async (file, mediaType, captureDate, description) => {
                  if (!id) return;
                  const upload = await mediaApi.getUploadUrl(id, file.name);
                  await fetch(upload.url, {
                    method: 'PUT',
                    headers: { 'Content-Type': file.type || 'application/octet-stream' },
                    body: file,
                  });
                  await mediaApi.register(id, {
                    originalName: file.name,
                    storagePath: upload.key,
                    mimeType: file.type || 'application/octet-stream',
                    sizeBytes: file.size,
                    mediaType,
                    stage: currentStage,
                    billingPeriod: currentStage === 7 ? currentBillingPeriod() : undefined,
                    captureDate,
                    description,
                  });
                  const refreshed = await mediaApi.list(id, { page: 1, limit: 100 });
                  setMediaItems(refreshed.media);
                }}
                onDelete={async (mediaId) => {
                  if (!id) return;
                  await mediaApi.delete(id, mediaId);
                  setMediaItems((prev) =>
                    prev.filter((item) => entityId(item as ProjectFile & { _id?: string }) !== mediaId),
                  );
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* ═══ Finance Tab ═══ */}
      {activeTab === 'Finance' && (
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
            <ProjectPaymentHistory
              projectId={id}
              onPaymentRecorded={async () => {
                const updatedProject = await projectsApi.getById(id);
                setProject(updatedProject);
              }}
            />
          )}

          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-6">
            <h3 className="text-h3 mb-4">Funding Sources</h3>
            <p className="text-body mb-6">
              MIG, WSIG, provincial budget, and other funding allocations with disbursed and remaining amounts.
            </p>
            <div className={TABLE_SURFACE}>
              <table className="min-w-full text-[0.85rem]">
                <thead>
                  <tr className={TABLE_HEAD_ROW}>
                    <th className={`${TABLE_HEAD_CELL} font-medium`}>Source</th>
                    <th className={`${TABLE_HEAD_CELL} text-right font-medium`}>Total</th>
                    <th className={`${TABLE_HEAD_CELL} text-right font-medium`}>Disbursed</th>
                    <th className={`${TABLE_HEAD_CELL} text-right font-medium`}>Remaining</th>
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
                      className={`${TABLE_ROW_BASE} ${i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-surface-alt)]'}`}
                    >
                      <td className={`${TABLE_CELL} font-medium text-[var(--text-primary)]`}>{rowName}</td>
                      <td className={`${TABLE_CELL} text-right text-financial`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        {isClientTemp ? '—— Restricted' : formatRands(rowTotal)}
                      </td>
                      <td className={`${TABLE_CELL} text-right text-financial`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        {isClientTemp ? '—— Restricted' : formatRands(rowDisbursed)}
                      </td>
                      <td className={`${TABLE_CELL} text-right text-financial`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        {isClientTemp ? '—— Restricted' : formatRands(rowRemaining)}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
                <p className="text-eyebrow mb-1">Original Contract Value</p>
                <p className="text-currency">
                  {isClientTemp
                    ? '—— Restricted'
                    : formatRands(centsToRands(project?.contractValueOriginal || 0))}
                </p>
              </div>
              <div className="border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
                <p className="text-eyebrow mb-1">Total Variations</p>
                <p className="text-currency">
                  {isClientTemp
                    ? '—— Restricted'
                    : formatRands(
                        variations
                          .filter((v) => v.status === 'approved')
                          .reduce((sum, v) => sum + (v.approvedAmount ?? 0), 0),
                      )}
                </p>
              </div>
              <div className="border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
                <p className="text-eyebrow mb-1">Adjusted Contract Value</p>
                <p className="text-currency">
                  {isClientTemp
                    ? '—— Restricted'
                    : formatRands(centsToRands(project?.contractValueAdjusted || 0))}
                </p>
              </div>
            </div>

            <div className="border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-h3">Variation Orders</h3>
                {canCreateVariation && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setSelectedVariation(null);
                      setIsVariationDrawerOpen(true);
                    }}
                  >
                    New Variation Order
                  </Button>
                )}
              </div>
              <div className={TABLE_SURFACE}>
                <table className="min-w-full text-[0.85rem]">
                  <thead>
                    <tr className={TABLE_HEAD_ROW}>
                      <th className={TABLE_HEAD_CELL}>VO Number</th>
                      <th className={TABLE_HEAD_CELL}>Description</th>
                      <th className={`${TABLE_HEAD_CELL} text-right`}>Estimated</th>
                      <th className={`${TABLE_HEAD_CELL} text-right`}>Approved</th>
                      <th className={TABLE_HEAD_CELL}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variations.map((vo) => (
                      <tr
                        key={entityId(vo as VariationOrder & { _id?: string })}
                        className={`${TABLE_ROW_BASE} hover:bg-[var(--bg-surface-alt)] cursor-pointer`}
                        onClick={() => {
                          setSelectedVariation(vo);
                          setIsVariationDrawerOpen(true);
                        }}
                      >
                        <td className={TABLE_CELL}>{vo.variationNumber}</td>
                        <td className={`${TABLE_CELL} max-w-[280px] truncate`}>{vo.description}</td>
                        <td className={`${TABLE_CELL} text-right`}>
                          {isClientTemp ? '—— Restricted' : formatRands(vo.estimatedAmount)}
                        </td>
                        <td className={`${TABLE_CELL} text-right`}>
                          {isClientTemp
                            ? '—— Restricted'
                            : vo.approvedAmount != null
                              ? formatRands(vo.approvedAmount)
                              : '—'}
                        </td>
                        <td className={TABLE_CELL}>
                          <span className="text-xs text-[var(--text-secondary)]">{vo.status.replace(/_/g, ' ')}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <VariationOrderDrawer
              isOpen={isVariationDrawerOpen}
              onClose={() => setIsVariationDrawerOpen(false)}
              selected={selectedVariation}
              canCreate={canCreateVariation}
              canApprove={canApproveDocuments}
              onCreate={async (payload) => {
                if (!id) return;
                await variationsApi.create(id, payload);
                setIsVariationDrawerOpen(false);
                setVariations(await variationsApi.list(id));
              }}
              onSubmit={async (voId) => {
                if (!id) return;
                await variationsApi.submit(id, voId);
                setVariations(await variationsApi.list(id));
              }}
              onApprove={async (voId) => {
                if (!id) return;
                await variationsApi.approve(id, voId);
                setVariations(await variationsApi.list(id));
                const updatedProject = await projectsApi.getById(id);
                setProject(updatedProject);
              }}
              onReject={async (voId, reason) => {
                if (!id) return;
                await variationsApi.reject(id, voId, reason);
                setVariations(await variationsApi.list(id));
              }}
            />
          </div>
        </div>
      )}

      {activeTab === 'Audit Trail' && (
        <div className="border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-h3">Audit Trail</h3>
            <a
              className="text-[0.72rem] underline text-[var(--text-muted)]"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.open(
                  `${window.location.origin}/api/v1/${encodeURIComponent(tenantSlug || '')}/projects/${id}/audit/export?format=csv`,
                  '_blank'
                );
              }}
            >
              Export
            </a>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {AUDIT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={[
                    'px-2 py-1 border text-[0.68rem] transition-colors',
                    auditActionFilter === preset.action
                      ? 'border-[var(--accent)] text-[var(--accent)]'
                      : 'border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                  ].join(' ')}
                  onClick={() => {
                    setAuditActionFilter(preset.action);
                    setAuditOverrideOnly(Boolean(preset.overrideOnly));
                    setAuditPage(1);
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <input
              value={auditActionFilter}
              onChange={(e) => {
                setAuditActionFilter(e.target.value);
                setAuditOverrideOnly(false);
                setAuditPage(1);
              }}
              className="bg-transparent border border-[var(--border-default)] px-3 py-2 text-[0.8rem] w-full md:w-[220px]"
              placeholder="Action (exact)"
            />
            <input
              type="date"
              value={auditDateFrom}
              onChange={(e) => {
                setAuditDateFrom(e.target.value);
                setAuditPage(1);
              }}
              className="bg-transparent border border-[var(--border-default)] px-3 py-2 text-[0.8rem]"
            />
            <input
              type="date"
              value={auditDateTo}
              onChange={(e) => {
                setAuditDateTo(e.target.value);
                setAuditPage(1);
              }}
              className="bg-transparent border border-[var(--border-default)] px-3 py-2 text-[0.8rem]"
            />
          </div>
          {auditQuery.isLoading ? (
            <p className="text-[0.8rem] text-[var(--text-muted)]">Loading audit events...</p>
          ) : auditEntries.length === 0 ? (
            <p className="text-[0.8rem] text-[var(--text-muted)]">No audit events found.</p>
          ) : (
            <div className="space-y-2">
              {auditEntries.map((entry) => (
                <div key={entry._id} className="border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-3">
                  <p className="text-[0.78rem] text-[var(--text-primary)]">{entry.action}</p>
                  <p className="text-[0.68rem] text-[var(--text-muted)]">
                    {new Date(entry.timestamp).toLocaleString()} · {entry.entityType} · {entry.actorRole || 'system'}
                  </p>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <p className="text-[0.72rem] text-[var(--text-muted)]">
                  Page {auditQuery.data?.page || auditPage} · Total {auditQuery.data?.total || auditEntries.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="!py-1 !px-2 text-[0.72rem]"
                    onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                    disabled={auditPage <= 1}
                  >
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="!py-1 !px-2 text-[0.72rem]"
                    onClick={() => setAuditPage((p) => p + 1)}
                    disabled={(auditQuery.data?.entries?.length || 0) < 15}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
