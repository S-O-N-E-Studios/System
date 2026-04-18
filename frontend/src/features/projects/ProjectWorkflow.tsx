import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useUiStore } from '@/store/uiStore';
import { useTenantStore } from '@/store/tenantStore';
import { useCan } from '@/rbac/useCan';
import {
  workflowApi,
  type ProcurementStepStatus,
  type WorkflowGateRequirement,
} from '@/api/workflow';
import { procurementStepStatusLabel } from '@/utils/statusLabels';

const FALLBACK_TOP_LEVEL_STAGES = [
  { id: 1, label: 'Initiation' },
  { id: 2, label: 'Project Planning' },
  { id: 3, label: 'Project Execution' },
  { id: 4, label: 'Monitoring & Control' },
  { id: 5, label: 'Closure' },
] as const;

const REQUIRED_APPOINTMENT_TYPES = [
  'principal_agent',
  'land_surveyor',
  'geo_technical_engineer',
  'environmental_specialist',
  'architect',
  'structural_engineer',
] as const;

const STEP_KEYS = ['advert', 'recommendations', 'approval', 'appointment_letter', 'sla'] as const;

function prettyLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function parseIdList(input: string) {
  return input
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function formatIdShort(id?: string | null) {
  if (!id) return '';
  if (id.length <= 10) return id;
  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}

function FileIdChip({
  tenantSlug,
  fileId,
  label,
}: {
  tenantSlug: string;
  fileId?: string | null;
  label?: string;
}) {
  if (!fileId) return null;
  return (
    <a
      href={`${window.location.origin}/api/v1/${encodeURIComponent(tenantSlug)}/files/${fileId}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center border border-[var(--border-default)] px-2 py-0.5 text-[0.66rem] text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
      title={fileId}
    >
      {label ? `${label}: ` : ''}
      {formatIdShort(fileId)}
    </a>
  );
}

type Props = { projectId: string };
const PROC_REASON_MODAL_ID = 'workflow-proc-reason';
const EOT_MODAL_ID = 'workflow-eot-create';
const PENALTY_MODAL_ID = 'workflow-penalty-create';
const WORKFLOW_PANEL_PREFS_KEY = 'evidentiary-workflow-panels-v1';

export default function ProjectWorkflow({ projectId }: Props) {
  const queryClient = useQueryClient();
  const { addToast, openModal, closeModal } = useUiStore();
  const tenantSlug = useTenantStore((state) => state.getSlug());
  const can = useCan();
  const canEditWorkflow = can('create_project');
  const canConsultantProcurement = can('create_project') || can('edit_project');
  const canReviewProcurement = can('approve_documents');
  const canApproveWorkflow = can('approve_documents');
  const [blockedRequirements, setBlockedRequirements] = useState<WorkflowGateRequirement[]>([]);
  const [pendingStepReview, setPendingStepReview] = useState<{
    trailId: string;
    stepKey: (typeof STEP_KEYS)[number];
    status: ProcurementStepStatus;
  } | null>(null);
  const [procReason, setProcReason] = useState('');
  const [eotReason, setEotReason] = useState('');
  const [eotDays, setEotDays] = useState('14');
  const [eotAssignedApproverId, setEotAssignedApproverId] = useState('');
  const [eotConsultantFileId, setEotConsultantFileId] = useState('');
  const [eotPmuFileId, setEotPmuFileId] = useState('');
  const [eotApprovalFileId, setEotApprovalFileId] = useState('');
  const [eotSupportingFileIds, setEotSupportingFileIds] = useState('');
  const [eotThresholdDays, setEotThresholdDays] = useState('28');
  const [eotWarningNote, setEotWarningNote] = useState('');
  const [penaltyReason, setPenaltyReason] = useState('');
  const [penaltyAmountCents, setPenaltyAmountCents] = useState('0');
  const [penaltyType, setPenaltyType] = useState<'delay' | 'quality' | 'contractual' | 'other'>('other');
  const [penaltySupportingFileIds, setPenaltySupportingFileIds] = useState('');
  const [penaltyAssignedApproverId, setPenaltyAssignedApproverId] = useState('');
  const [penaltyThresholdCents, setPenaltyThresholdCents] = useState('500000');
  const [penaltyWarningNote, setPenaltyWarningNote] = useState('');
  const [expandedSections, setExpandedSections] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        procurement: false,
        performance: false,
        eot: false,
        penalties: false,
        audit: false,
      };
    }
    try {
      const raw = window.localStorage.getItem(WORKFLOW_PANEL_PREFS_KEY);
      if (!raw) {
        return {
          procurement: false,
          performance: false,
          eot: false,
          penalties: false,
          audit: false,
        };
      }
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      return {
        procurement: Boolean(parsed.procurement),
        performance: Boolean(parsed.performance),
        eot: Boolean(parsed.eot),
        penalties: Boolean(parsed.penalties),
        audit: Boolean(parsed.audit),
      };
    } catch {
      return {
        procurement: false,
        performance: false,
        eot: false,
        penalties: false,
        audit: false,
      };
    }
  });

  const workflowQuery = useQuery({
    queryKey: ['project-workflow', projectId],
    queryFn: () => workflowApi.getWorkflow(projectId),
    enabled: Boolean(projectId),
  });

  const trailsQuery = useQuery({
    queryKey: ['project-procurement-trails', projectId],
    queryFn: () => workflowApi.listProcurementTrails(projectId),
    enabled: Boolean(projectId),
  });

  const performanceQuery = useQuery({
    queryKey: ['project-performance', projectId],
    queryFn: () => workflowApi.listPerformance(projectId),
    enabled: Boolean(projectId),
  });

  const eotQuery = useQuery({
    queryKey: ['project-eot', projectId],
    queryFn: () => workflowApi.listExtensionOfTime(projectId),
    enabled: Boolean(projectId),
  });

  const penaltiesQuery = useQuery({
    queryKey: ['project-penalties', projectId],
    queryFn: () => workflowApi.listPenalties(projectId),
    enabled: Boolean(projectId),
  });

  const auditQuery = useQuery({
    queryKey: ['project-audit', projectId],
    queryFn: () => workflowApi.listAuditLog(projectId, { limit: 6 }),
    enabled: Boolean(projectId),
  });

  const advanceMutation = useMutation({
    mutationFn: () => workflowApi.advanceWorkflow(projectId),
    onSuccess: async () => {
      setBlockedRequirements([]);
      addToast({ type: 'success', message: 'Workflow advanced.' });
      await queryClient.invalidateQueries({ queryKey: ['project-workflow', projectId] });
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const reqs =
          (error.response.data?.details?.requirements as WorkflowGateRequirement[] | undefined) || [];
        setBlockedRequirements(reqs);
        addToast({ type: 'warning', message: 'Workflow blocked. Review unmet requirements.' });
        return;
      }
      addToast({ type: 'error', message: 'Could not advance workflow.' });
    },
  });

  const createTrailMutation = useMutation({
    mutationFn: (appointmentType: string) =>
      workflowApi.createProcurementTrail(projectId, { appointmentType }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['project-procurement-trails', projectId] });
    },
  });

  const reviewStepMutation = useMutation({
    mutationFn: ({
      trailId,
      stepKey,
      status,
      reason,
    }: {
      trailId: string;
      stepKey: (typeof STEP_KEYS)[number];
      status: ProcurementStepStatus;
      reason?: string;
    }) => workflowApi.reviewProcurementStep(projectId, trailId, stepKey, { status, reason }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['project-procurement-trails', projectId] });
    },
    onError: () => addToast({ type: 'error', message: 'Could not update procurement step.' }),
  });

  const createPerformanceMutation = useMutation({
    mutationFn: () => {
      const now = new Date();
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return workflowApi.upsertPerformance(projectId, {
        period,
        consultant: {
          rag: 'amber',
          progressProjectedPct: 50,
          progressActualPct: 45,
          expenditureProjectedPct: 50,
          expenditureActualPct: 41,
        },
        construction: {
          rag: 'amber',
          progressProjectedPct: 48,
          progressActualPct: 43,
          expenditureProjectedPct: 52,
          expenditureActualPct: 47,
          timeProjectedPct: 50,
          timeActualPct: 55,
        },
      });
    },
    onSuccess: async () => {
      addToast({ type: 'success', message: 'Performance snapshot saved.' });
      await queryClient.invalidateQueries({ queryKey: ['project-performance', projectId] });
    },
    onError: () => addToast({ type: 'error', message: 'Could not save performance snapshot.' }),
  });

  const createEotMutation = useMutation({
    mutationFn: ({
      reason,
      requestedDays,
      consultantRecommendationFileId,
      pmuRecommendationFileId,
      approvalFileId,
      supportingFileIds,
      assignedApproverId,
      requestedDaysThreshold,
      thresholdExceeded,
      thresholdWarningNote,
    }: {
      reason: string;
      requestedDays: number;
      consultantRecommendationFileId?: string;
      pmuRecommendationFileId?: string;
      approvalFileId?: string;
      supportingFileIds?: string[];
      assignedApproverId?: string;
      requestedDaysThreshold?: number;
      thresholdExceeded?: boolean;
      thresholdWarningNote?: string;
    }) => {
      if (!reason || reason.trim().length < 3) throw new Error('EOT reason is required');
      if (!Number.isFinite(requestedDays) || requestedDays <= 0) {
        throw new Error('Requested days must be greater than zero');
      }
      return workflowApi.createExtensionOfTime(projectId, {
        reason: reason.trim(),
        requestedDays,
        consultantRecommendationFileId,
        pmuRecommendationFileId,
        approvalFileId,
        supportingFileIds,
        assignedApproverId,
        requestedDaysThreshold,
        thresholdExceeded,
        thresholdWarningNote,
      });
    },
    onSuccess: async () => {
      setEotReason('');
      setEotDays('14');
      setEotAssignedApproverId('');
      setEotConsultantFileId('');
      setEotPmuFileId('');
      setEotApprovalFileId('');
      setEotSupportingFileIds('');
      setEotThresholdDays('28');
      setEotWarningNote('');
      closeModal();
      addToast({ type: 'success', message: 'EOT request created.' });
      await queryClient.invalidateQueries({ queryKey: ['project-eot', projectId] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Could not create EOT request.';
      addToast({ type: 'error', message });
    },
  });

  const submitEotMutation = useMutation({
    mutationFn: (eotId: string) => workflowApi.submitExtensionOfTime(projectId, eotId),
    onSuccess: async () => {
      addToast({ type: 'success', message: 'EOT submitted for approval.' });
      await queryClient.invalidateQueries({ queryKey: ['project-eot', projectId] });
    },
    onError: () => addToast({ type: 'error', message: 'Could not submit EOT request.' }),
  });

  const approveEotMutation = useMutation({
    mutationFn: ({ eotId, daysApproved }: { eotId: string; daysApproved?: number }) =>
      workflowApi.approveExtensionOfTime(projectId, eotId, daysApproved !== undefined ? { daysApproved } : undefined),
    onSuccess: async () => {
      addToast({ type: 'success', message: 'EOT approved.' });
      await queryClient.invalidateQueries({ queryKey: ['project-eot', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['project-workflow', projectId] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Could not approve EOT request.';
      addToast({ type: 'error', message });
    },
  });

  const rejectEotMutation = useMutation({
    mutationFn: ({ eotId, reason }: { eotId: string; reason: string }) =>
      workflowApi.rejectExtensionOfTime(projectId, eotId, { reason }),
    onSuccess: async () => {
      addToast({ type: 'success', message: 'EOT rejected.' });
      await queryClient.invalidateQueries({ queryKey: ['project-eot', projectId] });
    },
    onError: () => addToast({ type: 'error', message: 'Could not reject EOT request.' }),
  });

  const withdrawEotMutation = useMutation({
    mutationFn: (eotId: string) => workflowApi.withdrawExtensionOfTime(projectId, eotId),
    onSuccess: async () => {
      addToast({ type: 'success', message: 'EOT withdrawn.' });
      await queryClient.invalidateQueries({ queryKey: ['project-eot', projectId] });
    },
    onError: () => addToast({ type: 'error', message: 'Could not withdraw EOT request.' }),
  });

  const createPenaltyMutation = useMutation({
    mutationFn: ({
      reason,
      amountCents,
      penaltyType: nextPenaltyType,
      supportingFileIds,
      assignedApproverId,
      thresholdAmountCents,
      thresholdExceeded,
      thresholdWarningNote,
    }: {
      reason: string;
      amountCents: number;
      penaltyType: 'delay' | 'quality' | 'contractual' | 'other';
      supportingFileIds?: string[];
      assignedApproverId?: string;
      thresholdAmountCents?: number;
      thresholdExceeded?: boolean;
      thresholdWarningNote?: string;
    }) => {
      if (!reason || reason.trim().length < 3) throw new Error('Penalty reason is required');
      if (!Number.isFinite(amountCents) || amountCents < 0) {
        throw new Error('Penalty amount must be zero or greater');
      }
      return workflowApi.createPenalty(projectId, {
        penaltyType: nextPenaltyType,
        amountCents,
        reason: reason.trim(),
        supportingFileIds,
        assignedApproverId,
        thresholdAmountCents,
        thresholdExceeded,
        thresholdWarningNote,
      });
    },
    onSuccess: async () => {
      setPenaltyReason('');
      setPenaltyAmountCents('0');
      setPenaltyType('other');
      setPenaltySupportingFileIds('');
      setPenaltyAssignedApproverId('');
      setPenaltyThresholdCents('500000');
      setPenaltyWarningNote('');
      closeModal();
      addToast({ type: 'success', message: 'Penalty record created.' });
      await queryClient.invalidateQueries({ queryKey: ['project-penalties', projectId] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Could not create penalty record.';
      addToast({ type: 'error', message });
    },
  });

  const submitPenaltyMutation = useMutation({
    mutationFn: (penaltyId: string) => workflowApi.submitPenalty(projectId, penaltyId),
    onSuccess: async () => {
      addToast({ type: 'success', message: 'Penalty submitted for approval.' });
      await queryClient.invalidateQueries({ queryKey: ['project-penalties', projectId] });
    },
    onError: () => addToast({ type: 'error', message: 'Could not submit penalty.' }),
  });

  const approvePenaltyMutation = useMutation({
    mutationFn: (penaltyId: string) => workflowApi.approvePenalty(projectId, penaltyId),
    onSuccess: async () => {
      addToast({ type: 'success', message: 'Penalty approved.' });
      await queryClient.invalidateQueries({ queryKey: ['project-penalties', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['project-workflow', projectId] });
    },
    onError: () => addToast({ type: 'error', message: 'Could not approve penalty.' }),
  });

  const rejectPenaltyMutation = useMutation({
    mutationFn: ({ penaltyId, reason }: { penaltyId: string; reason: string }) =>
      workflowApi.rejectPenalty(projectId, penaltyId, { reason }),
    onSuccess: async () => {
      addToast({ type: 'success', message: 'Penalty rejected.' });
      await queryClient.invalidateQueries({ queryKey: ['project-penalties', projectId] });
    },
    onError: () => addToast({ type: 'error', message: 'Could not reject penalty.' }),
  });

  const waivePenaltyMutation = useMutation({
    mutationFn: (penaltyId: string) => workflowApi.waivePenalty(projectId, penaltyId),
    onSuccess: async () => {
      addToast({ type: 'success', message: 'Penalty waived.' });
      await queryClient.invalidateQueries({ queryKey: ['project-penalties', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['project-workflow', projectId] });
    },
    onError: () => addToast({ type: 'error', message: 'Could not waive penalty.' }),
  });

  const stages = useMemo(
    () =>
      workflowQuery.data?.topLevelStages?.map((s) => ({ id: s.id, label: s.label })) ||
      FALLBACK_TOP_LEVEL_STAGES,
    [workflowQuery.data?.topLevelStages]
  );

  const stageTopLevel = workflowQuery.data?.stageTopLevel ?? 1;
  const checkpoint = workflowQuery.data?.stageCheckpoint ?? 'stage1.consultant_appointment';
  const gateRequirements = workflowQuery.data?.gateRequirements || [];
  const effectiveBlockers = blockedRequirements.length > 0 ? blockedRequirements : gateRequirements;
  const trails = trailsQuery.data || [];
  const latestPerformance = performanceQuery.data?.latest || null;
  const eotRequests = eotQuery.data || [];
  const penalties = penaltiesQuery.data || [];
  const auditEntries = auditQuery.data?.entries || [];
  const eotThresholdExceeded =
    Number.isFinite(Number(eotDays)) &&
    Number.isFinite(Number(eotThresholdDays)) &&
    Number(eotDays) > Number(eotThresholdDays);
  const penaltyThresholdExceeded =
    Number.isFinite(Number(penaltyAmountCents)) &&
    Number.isFinite(Number(penaltyThresholdCents)) &&
    Number(penaltyAmountCents) > Number(penaltyThresholdCents);

  const missingAppointmentTypes = REQUIRED_APPOINTMENT_TYPES.filter(
    (type) => !trails.some((trail) => trail.appointmentType === type)
  );

  const submitStepReason = () => {
    if (!pendingStepReview) return;
    if (procReason.trim().length < 3) {
      addToast({ type: 'warning', message: 'Reason is required (at least 3 characters).' });
      return;
    }
    reviewStepMutation.mutate({
      ...pendingStepReview,
      reason: procReason.trim(),
    });
    setPendingStepReview(null);
    setProcReason('');
    closeModal();
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(WORKFLOW_PANEL_PREFS_KEY, JSON.stringify(expandedSections));
  }, [expandedSections]);

  const blockerSeverity = (req: WorkflowGateRequirement): 'high' | 'medium' => {
    const text = `${req.code} ${req.detail}`.toLowerCase();
    if (text.includes('missing') || text.includes('blocked') || text.includes('not approved')) return 'high';
    return 'medium';
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-6 space-y-6 animate-fade-in">
      <div>
        <h3 className="text-h3 mb-2">Workflow</h3>
        <p className="text-body text-[var(--text-muted)]">
          EVIDENTIARY v9 uses a five-stage workflow shell with enforceable internal checkpoints.
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={() => advanceMutation.mutate()}
          isLoading={advanceMutation.isPending}
          disabled={!canEditWorkflow}
        >
          Run Gate Check
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {stages.map((stage) => {
          const isActive = stage.id === stageTopLevel;
          const isDone = stage.id < stageTopLevel;
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

      <div className="border border-[var(--border-default)] bg-[var(--bg-surface-alt)] px-4 py-3">
        <p className="text-[0.65rem] uppercase tracking-[0.12em] text-[var(--text-muted)] mb-1">
          Active checkpoint
        </p>
        <p className="text-[0.82rem] text-[var(--text-primary)]">{checkpoint}</p>
      </div>

      {effectiveBlockers.length > 0 && (
        <div className="border border-[var(--status-warning)] bg-[var(--accent-sand-glow)] p-4">
          <p className="text-[0.7rem] uppercase tracking-[0.12em] text-[var(--status-warning)] mb-2">
            Gate blockers ({effectiveBlockers.length})
          </p>
          <div className="space-y-2">
            {effectiveBlockers.map((req) => (
              <div key={`${req.code}-${req.entityKey}`} className="border border-[var(--border-default)] px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={[
                      'inline-flex items-center gap-1 text-[0.62rem] uppercase tracking-[0.1em]',
                      blockerSeverity(req) === 'high' ? 'text-[var(--status-danger)]' : 'text-[var(--status-warning)]',
                    ].join(' ')}
                  >
                    {blockerSeverity(req) === 'high' ? (
                      <ShieldAlert className="h-3 w-3" />
                    ) : (
                      <AlertTriangle className="h-3 w-3" />
                    )}
                    {blockerSeverity(req)}
                  </span>
                </div>
                <p className="text-[0.78rem] text-[var(--text-primary)]">{req.detail}</p>
                <p className="text-[0.65rem] text-[var(--text-muted)]">
                  {req.code} · {req.entityKey}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-4 space-y-4">
        <button
          type="button"
          className="w-full flex items-center justify-between gap-3 text-left"
          onClick={() =>
            setExpandedSections((prev) => ({ ...prev, procurement: !prev.procurement }))
          }
        >
          <div>
            <h4 className="text-h3 text-[0.95rem]">Sub-consultant procurement trails</h4>
            <p className="text-[0.72rem] text-[var(--text-muted)]">
              Each appointment follows Advert, Recommendations, Approval, Appointment Letter, and SLA. Consultants mark
              steps Not applicable where a role is not required; client approvers record Approved or Not approved.
            </p>
          </div>
          <span className="text-[0.68rem] text-[var(--text-muted)]">
            {expandedSections.procurement ? 'Hide' : 'Show'}
          </span>
        </button>

        {expandedSections.procurement && (
          <>

        {missingAppointmentTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {missingAppointmentTypes.map((type) => (
              <Button
                key={type}
                type="button"
                variant="secondary"
                className="!py-1.5 !px-2.5 !text-[0.68rem]"
                onClick={() => createTrailMutation.mutate(type)}
                isLoading={createTrailMutation.isPending}
              >
                Add {prettyLabel(type)}
              </Button>
            ))}
          </div>
        )}

        {trailsQuery.isLoading ? (
          <p className="text-[0.75rem] text-[var(--text-muted)]">Loading procurement trails...</p>
        ) : trails.length === 0 ? (
          <p className="text-[0.75rem] text-[var(--text-muted)]">
            No procurement trails yet. Add appointment types to begin.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-[0.76rem]">
              <thead>
                <tr className="border-b border-[var(--border-default)]">
                  <th className="text-left py-2 pr-3">Appointment</th>
                  {STEP_KEYS.map((step) => (
                    <th key={step} className="text-left py-2 pr-3">
                      {prettyLabel(step)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trails.map((trail) => (
                  <tr key={trail._id} className="border-b border-[var(--border-default)]">
                    <td className="py-2 pr-3 text-[var(--text-primary)]">{prettyLabel(trail.appointmentType)}</td>
                    {STEP_KEYS.map((stepKey) => {
                      const step = trail.steps.find((s) => s.stepKey === stepKey);
                      const status = step?.status || 'not_applicable';
                      const canUseStepControl = canReviewProcurement || canConsultantProcurement;
                      return (
                        <td key={`${trail._id}-${stepKey}`} className="py-2 pr-3">
                          <select
                            value={status}
                            onChange={(e) => {
                              if (!canUseStepControl) return;
                              const nextStatus = e.target.value as ProcurementStepStatus;
                              if (!canReviewProcurement && nextStatus !== 'not_applicable') {
                                addToast({
                                  type: 'warning',
                                  message: 'Only client approvers can mark steps approved or not approved.',
                                });
                                return;
                              }
                              if (!canConsultantProcurement && nextStatus === 'not_applicable') {
                                addToast({
                                  type: 'warning',
                                  message: 'Only the consulting team can mark a step as not applicable.',
                                });
                                return;
                              }
                              if (nextStatus === 'not_approved') {
                                setPendingStepReview({
                                  trailId: trail._id,
                                  stepKey,
                                  status: nextStatus,
                                });
                                setProcReason(step?.reason || '');
                                openModal(PROC_REASON_MODAL_ID);
                                return;
                              }
                              reviewStepMutation.mutate({
                                trailId: trail._id,
                                stepKey,
                                status: nextStatus,
                              });
                            }}
                            className="bg-transparent border border-[var(--border-default)] px-2 py-1 text-[0.72rem]"
                            disabled={!canUseStepControl}
                          >
                            <option value="approved">Approved</option>
                            <option value="not_approved">{procurementStepStatusLabel('not_approved')}</option>
                            <option value="not_applicable">{procurementStepStatusLabel('not_applicable')}</option>
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-4 space-y-3">
          <button
            type="button"
            className="w-full flex items-center justify-between"
            onClick={() => setExpandedSections((prev) => ({ ...prev, performance: !prev.performance }))}
          >
            <h4 className="text-h3 text-[0.9rem]">Performance Snapshot</h4>
            <span className="text-[0.68rem] text-[var(--text-muted)]">
              {expandedSections.performance ? 'Hide' : 'Show'}
            </span>
          </button>
          {expandedSections.performance &&
            (latestPerformance ? (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="!py-1.5 !px-2.5 !text-[0.68rem]"
                  onClick={() => createPerformanceMutation.mutate()}
                  isLoading={createPerformanceMutation.isPending}
                >
                  Capture
                </Button>
                <div className="space-y-1">
                  <p className="text-[0.74rem] text-[var(--text-primary)]">Period: {latestPerformance.period}</p>
                  <p className="text-[0.7rem] text-[var(--text-muted)]">
                    Consultant RAG: {latestPerformance.consultant.rag}
                  </p>
                  <p className="text-[0.7rem] text-[var(--text-muted)]">
                    Construction RAG: {latestPerformance.construction.rag}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[0.72rem] text-[var(--text-muted)]">No snapshot yet.</p>
            ))}
        </div>

        <div className="border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-4 space-y-3">
          <button
            type="button"
            className="w-full flex items-center justify-between"
            onClick={() => setExpandedSections((prev) => ({ ...prev, eot: !prev.eot }))}
          >
            <h4 className="text-h3 text-[0.9rem]">Extension of Time</h4>
            <span className="text-[0.68rem] text-[var(--text-muted)]">
              {expandedSections.eot ? 'Hide' : 'Show'}
            </span>
          </button>
          {expandedSections.eot &&
            (
              <div className="space-y-2">
                {canEditWorkflow && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="!py-1.5 !px-2.5 !text-[0.68rem]"
                    onClick={() => openModal(EOT_MODAL_ID)}
                    isLoading={createEotMutation.isPending}
                  >
                    New
                  </Button>
                )}
                {eotRequests.length === 0 ? (
                  <p className="text-[0.72rem] text-[var(--text-muted)]">No EOT requests.</p>
                ) : eotRequests.slice(0, 3).map((row) => (
                <div key={row._id} className="border border-[var(--border-default)] p-2 space-y-1">
                  <p className="text-[0.72rem] text-[var(--text-primary)]">
                    {row.referenceNumber} · {row.status} · {row.requestedDays} days
                  </p>
                  {row.assignedApproverId ? (
                    <p className="text-[0.68rem] text-[var(--text-muted)]">
                      Approver: {formatIdShort(row.assignedApproverId)}
                    </p>
                  ) : null}
                  {row.thresholdExceeded ? (
                    <p className="text-[0.68rem] text-[var(--status-warning)]">
                      Threshold exceeded
                      {row.requestedDaysThreshold ? ` (${row.requestedDaysThreshold} days)` : ''}
                    </p>
                  ) : null}
                  {row.thresholdWarningNote ? (
                    <p className="text-[0.68rem] text-[var(--text-muted)]">{row.thresholdWarningNote}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-1">
                    <FileIdChip
                      tenantSlug={tenantSlug || ''}
                      fileId={row.consultantRecommendationFileId}
                      label="Consultant"
                    />
                    <FileIdChip tenantSlug={tenantSlug || ''} fileId={row.pmuRecommendationFileId} label="PMU" />
                    <FileIdChip tenantSlug={tenantSlug || ''} fileId={row.approvalFileId} label="Approval" />
                    {(row.supportingFileIds || []).slice(0, 3).map((fileId) => (
                      <FileIdChip
                        key={`${row._id}-${fileId}`}
                        tenantSlug={tenantSlug || ''}
                        fileId={fileId}
                        label="Support"
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {row.status === 'draft' && canEditWorkflow && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="!py-1 !px-2 !text-[0.64rem]"
                        onClick={() => submitEotMutation.mutate(row._id)}
                        isLoading={submitEotMutation.isPending}
                      >
                        Submit
                      </Button>
                    )}
                    {row.status === 'pending_approval' && canApproveWorkflow && (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          className="!py-1 !px-2 !text-[0.64rem]"
                          onClick={() =>
                            approveEotMutation.mutate({
                              eotId: row._id,
                              daysApproved: row.requestedDays,
                            })
                          }
                          isLoading={approveEotMutation.isPending}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="!py-1 !px-2 !text-[0.64rem]"
                          onClick={() => {
                            const reason = window.prompt('Enter rejection reason');
                            if (!reason || reason.trim().length < 3) return;
                            rejectEotMutation.mutate({ eotId: row._id, reason: reason.trim() });
                          }}
                          isLoading={rejectEotMutation.isPending}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {row.status === 'pending_approval' && canEditWorkflow && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="!py-1 !px-2 !text-[0.64rem]"
                        onClick={() => withdrawEotMutation.mutate(row._id)}
                        isLoading={withdrawEotMutation.isPending}
                      >
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              </div>
            )}
        </div>

        <div className="border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-4 space-y-3">
          <button
            type="button"
            className="w-full flex items-center justify-between"
            onClick={() => setExpandedSections((prev) => ({ ...prev, penalties: !prev.penalties }))}
          >
            <h4 className="text-h3 text-[0.9rem]">Penalties</h4>
            <span className="text-[0.68rem] text-[var(--text-muted)]">
              {expandedSections.penalties ? 'Hide' : 'Show'}
            </span>
          </button>
          {expandedSections.penalties &&
            (
              <div className="space-y-2">
                {canEditWorkflow && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="!py-1.5 !px-2.5 !text-[0.68rem]"
                    onClick={() => openModal(PENALTY_MODAL_ID)}
                    isLoading={createPenaltyMutation.isPending}
                  >
                    New
                  </Button>
                )}
                {penalties.length === 0 ? (
                  <p className="text-[0.72rem] text-[var(--text-muted)]">No penalties recorded.</p>
                ) : penalties.slice(0, 3).map((row) => (
                <div key={row._id} className="border border-[var(--border-default)] p-2 space-y-1">
                  <p className="text-[0.72rem] text-[var(--text-primary)]">
                    {row.penaltyType} · R{(row.amountCents / 100).toFixed(2)} · {row.status}
                  </p>
                  {row.assignedApproverId ? (
                    <p className="text-[0.68rem] text-[var(--text-muted)]">
                      Approver: {formatIdShort(row.assignedApproverId)}
                    </p>
                  ) : null}
                  {row.thresholdExceeded ? (
                    <p className="text-[0.68rem] text-[var(--status-warning)]">
                      Threshold exceeded
                      {typeof row.thresholdAmountCents === 'number'
                        ? ` (R${(row.thresholdAmountCents / 100).toFixed(2)})`
                        : ''}
                    </p>
                  ) : null}
                  {row.thresholdWarningNote ? (
                    <p className="text-[0.68rem] text-[var(--text-muted)]">{row.thresholdWarningNote}</p>
                  ) : null}
                  {row.rejectionReason ? (
                    <p className="text-[0.68rem] text-[var(--status-danger)]">Reason: {row.rejectionReason}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-1">
                    {(row.supportingFileIds || []).slice(0, 4).map((fileId) => (
                      <FileIdChip
                        key={`${row._id}-${fileId}`}
                        tenantSlug={tenantSlug || ''}
                        fileId={fileId}
                        label="Support"
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {row.status === 'draft' && canEditWorkflow && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="!py-1 !px-2 !text-[0.64rem]"
                        onClick={() => submitPenaltyMutation.mutate(row._id)}
                        isLoading={submitPenaltyMutation.isPending}
                      >
                        Submit
                      </Button>
                    )}
                    {row.status === 'pending_approval' && canApproveWorkflow && (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          className="!py-1 !px-2 !text-[0.64rem]"
                          onClick={() => approvePenaltyMutation.mutate(row._id)}
                          isLoading={approvePenaltyMutation.isPending}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="!py-1 !px-2 !text-[0.64rem]"
                          onClick={() => {
                            const reason = window.prompt('Enter rejection reason');
                            if (!reason || reason.trim().length < 3) return;
                            rejectPenaltyMutation.mutate({ penaltyId: row._id, reason: reason.trim() });
                          }}
                          isLoading={rejectPenaltyMutation.isPending}
                        >
                          Reject
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="!py-1 !px-2 !text-[0.64rem]"
                          onClick={() => waivePenaltyMutation.mutate(row._id)}
                          isLoading={waivePenaltyMutation.isPending}
                        >
                          Waive
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              </div>
            )}
        </div>
      </div>

      <div className="border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-4 space-y-3">
        <button
          type="button"
          className="w-full flex items-center justify-between"
          onClick={() => setExpandedSections((prev) => ({ ...prev, audit: !prev.audit }))}
        >
          <h4 className="text-h3 text-[0.9rem]">Audit Trail</h4>
          <span className="text-[0.68rem] text-[var(--text-muted)]">
            {expandedSections.audit ? 'Hide' : 'Show'}
          </span>
        </button>
        {expandedSections.audit &&
          (auditQuery.isLoading ? (
            <p className="text-[0.72rem] text-[var(--text-muted)]">Loading audit entries...</p>
          ) : auditEntries.length === 0 ? (
            <p className="text-[0.72rem] text-[var(--text-muted)]">No audit entries yet.</p>
          ) : (
            <div className="space-y-2">
              <a
                className="text-[0.68rem] underline text-[var(--text-muted)]"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(
                    `${window.location.origin}/api/v1/${encodeURIComponent(tenantSlug || '')}/projects/${projectId}/audit/export?format=csv`,
                    '_blank'
                  );
                }}
              >
                Export
              </a>
              {auditEntries.map((entry) => (
                <p key={entry._id} className="text-[0.72rem] text-[var(--text-primary)]">
                  {new Date(entry.timestamp).toLocaleString()} · {entry.action} · {entry.actorRole || 'system'}
                </p>
              ))}
            </div>
          ))}
      </div>

      <Modal
        modalId={PROC_REASON_MODAL_ID}
        title="Reason Required"
        size="md"
        onClose={() => {
          setPendingStepReview(null);
          setProcReason('');
        }}
      >
        <div className="space-y-4">
          <p className="text-[0.82rem] text-[var(--text-muted)]">
            Please provide a reason for marking this procurement step as not approved.
          </p>
          <textarea
            value={procReason}
            onChange={(e) => setProcReason(e.target.value)}
            rows={4}
            className="w-full bg-transparent border border-[var(--border-default)] px-3 py-2 text-[0.82rem]"
            placeholder="Enter rejection reason"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => closeModal()}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={submitStepReason}
              isLoading={reviewStepMutation.isPending}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal modalId={EOT_MODAL_ID} title="Create Extension of Time" size="md">
        <div className="space-y-4">
          {!canEditWorkflow && (
            <p className="text-[0.8rem] text-[var(--status-warning)]">
              You do not have permission to create Extension of Time requests.
            </p>
          )}
          <div>
            <label className="text-eyebrow text-[var(--text-muted)]">Reason</label>
            <textarea
              value={eotReason}
              onChange={(e) => setEotReason(e.target.value)}
              rows={4}
              className="mt-1 w-full bg-transparent border border-[var(--border-default)] px-3 py-2 text-[0.82rem]"
              placeholder="Describe why an extension is required"
            />
          </div>
          <div>
            <label className="text-eyebrow text-[var(--text-muted)]">Requested Days</label>
            <input
              type="number"
              min={1}
              value={eotDays}
              onChange={(e) => setEotDays(e.target.value)}
              className="mt-1 w-full bg-transparent border border-[var(--border-default)] px-3 py-2 text-[0.82rem]"
            />
          </div>
          <div>
            <label className="text-eyebrow text-[var(--text-muted)]">Assigned Approver ID</label>
            <input
              type="text"
              value={eotAssignedApproverId}
              onChange={(e) => setEotAssignedApproverId(e.target.value)}
              className="mt-1 w-full bg-transparent border border-[var(--border-default)] px-3 py-2 text-[0.82rem]"
              placeholder="24-char user id"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-eyebrow text-[var(--text-muted)]">Consultant Recommendation File ID</label>
              <input
                type="text"
                value={eotConsultantFileId}
                onChange={(e) => setEotConsultantFileId(e.target.value)}
                className="mt-1 w-full bg-transparent border border-[var(--border-default)] px-3 py-2 text-[0.82rem]"
                placeholder="24-char file id"
              />
            </div>
            <div>
              <label className="text-eyebrow text-[var(--text-muted)]">PMU Recommendation File ID</label>
              <input
                type="text"
                value={eotPmuFileId}
                onChange={(e) => setEotPmuFileId(e.target.value)}
                className="mt-1 w-full bg-transparent border border-[var(--border-default)] px-3 py-2 text-[0.82rem]"
                placeholder="24-char file id"
              />
            </div>
          </div>
          <div>
            <label className="text-eyebrow text-[var(--text-muted)]">Approval File ID</label>
            <input
              type="text"
              value={eotApprovalFileId}
              onChange={(e) => setEotApprovalFileId(e.target.value)}
              className="mt-1 w-full bg-transparent border border-[var(--border-default)] px-3 py-2 text-[0.82rem]"
              placeholder="24-char file id"
            />
          </div>
          <div>
            <label className="text-eyebrow text-[var(--text-muted)]">Supporting File IDs (comma-separated)</label>
            <textarea
              value={eotSupportingFileIds}
              onChange={(e) => setEotSupportingFileIds(e.target.value)}
              rows={2}
              className="mt-1 w-full bg-transparent border border-[var(--border-default)] px-3 py-2 text-[0.82rem]"
              placeholder="fileId1, fileId2"
            />
          </div>
          <div>
            <label className="text-eyebrow text-[var(--text-muted)]">Warning Threshold (days)</label>
            <input
              type="number"
              min={1}
              value={eotThresholdDays}
              onChange={(e) => setEotThresholdDays(e.target.value)}
              className="mt-1 w-full bg-transparent border border-[var(--border-default)] px-3 py-2 text-[0.82rem]"
            />
          </div>
          {eotThresholdExceeded && (
            <div className="border border-[var(--status-warning)] bg-[var(--accent-sand-glow)] px-3 py-2">
              <p className="text-[0.74rem] text-[var(--status-warning)]">
                Warning: requested days exceed the configured threshold.
              </p>
            </div>
          )}
          <div>
            <label className="text-eyebrow text-[var(--text-muted)]">Threshold Warning Note</label>
            <textarea
              value={eotWarningNote}
              onChange={(e) => setEotWarningNote(e.target.value)}
              rows={2}
              className="mt-1 w-full bg-transparent border border-[var(--border-default)] px-3 py-2 text-[0.82rem]"
              placeholder="Optional note for threshold exceedance context"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => closeModal()}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={!canEditWorkflow}
              isLoading={createEotMutation.isPending}
              onClick={() =>
                createEotMutation.mutate({
                  reason: eotReason,
                  requestedDays: Number(eotDays),
                  consultantRecommendationFileId: eotConsultantFileId || undefined,
                  pmuRecommendationFileId: eotPmuFileId || undefined,
                  approvalFileId: eotApprovalFileId || undefined,
                  supportingFileIds: parseIdList(eotSupportingFileIds),
                  assignedApproverId: eotAssignedApproverId || undefined,
                  requestedDaysThreshold: Number(eotThresholdDays),
                  thresholdExceeded: eotThresholdExceeded,
                  thresholdWarningNote: eotWarningNote.trim() || undefined,
                })
              }
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal modalId={PENALTY_MODAL_ID} title="Create Penalty Record" size="md">
        <div className="space-y-4">
          {!canEditWorkflow && (
            <p className="text-[0.8rem] text-[var(--status-warning)]">
              You do not have permission to create penalties.
            </p>
          )}
          <div>
            <label className="text-eyebrow text-[var(--text-muted)]">Penalty Type</label>
            <select
              value={penaltyType}
              onChange={(e) =>
                setPenaltyType(e.target.value as 'delay' | 'quality' | 'contractual' | 'other')
              }
              className="mt-1 w-full bg-transparent border border-[var(--border-default)] px-3 py-2 text-[0.82rem]"
            >
              <option value="other">Other</option>
              <option value="delay">Delay</option>
              <option value="quality">Quality</option>
              <option value="contractual">Contractual</option>
            </select>
          </div>
          <div>
            <label className="text-eyebrow text-[var(--text-muted)]">Reason</label>
            <textarea
              value={penaltyReason}
              onChange={(e) => setPenaltyReason(e.target.value)}
              rows={4}
              className="mt-1 w-full bg-transparent border border-[var(--border-default)] px-3 py-2 text-[0.82rem]"
              placeholder="Enter penalty reason"
            />
          </div>
          <div>
            <label className="text-eyebrow text-[var(--text-muted)]">Amount (cents)</label>
            <input
              type="number"
              min={0}
              value={penaltyAmountCents}
              onChange={(e) => setPenaltyAmountCents(e.target.value)}
              className="mt-1 w-full bg-transparent border border-[var(--border-default)] px-3 py-2 text-[0.82rem]"
            />
          </div>
          <div>
            <label className="text-eyebrow text-[var(--text-muted)]">Assigned Approver ID</label>
            <input
              type="text"
              value={penaltyAssignedApproverId}
              onChange={(e) => setPenaltyAssignedApproverId(e.target.value)}
              className="mt-1 w-full bg-transparent border border-[var(--border-default)] px-3 py-2 text-[0.82rem]"
              placeholder="24-char user id"
            />
          </div>
          <div>
            <label className="text-eyebrow text-[var(--text-muted)]">Supporting File IDs (comma-separated)</label>
            <textarea
              value={penaltySupportingFileIds}
              onChange={(e) => setPenaltySupportingFileIds(e.target.value)}
              rows={2}
              className="mt-1 w-full bg-transparent border border-[var(--border-default)] px-3 py-2 text-[0.82rem]"
              placeholder="fileId1, fileId2"
            />
          </div>
          <div>
            <label className="text-eyebrow text-[var(--text-muted)]">Warning Threshold (cents)</label>
            <input
              type="number"
              min={0}
              value={penaltyThresholdCents}
              onChange={(e) => setPenaltyThresholdCents(e.target.value)}
              className="mt-1 w-full bg-transparent border border-[var(--border-default)] px-3 py-2 text-[0.82rem]"
            />
          </div>
          {penaltyThresholdExceeded && (
            <div className="border border-[var(--status-warning)] bg-[var(--accent-sand-glow)] px-3 py-2">
              <p className="text-[0.74rem] text-[var(--status-warning)]">
                Warning: penalty amount exceeds configured threshold.
              </p>
            </div>
          )}
          <div>
            <label className="text-eyebrow text-[var(--text-muted)]">Threshold Warning Note</label>
            <textarea
              value={penaltyWarningNote}
              onChange={(e) => setPenaltyWarningNote(e.target.value)}
              rows={2}
              className="mt-1 w-full bg-transparent border border-[var(--border-default)] px-3 py-2 text-[0.82rem]"
              placeholder="Optional note for threshold exceedance context"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => closeModal()}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={!canEditWorkflow}
              isLoading={createPenaltyMutation.isPending}
              onClick={() =>
                createPenaltyMutation.mutate({
                  penaltyType,
                  reason: penaltyReason,
                  amountCents: Number(penaltyAmountCents),
                  supportingFileIds: parseIdList(penaltySupportingFileIds),
                  assignedApproverId: penaltyAssignedApproverId || undefined,
                  thresholdAmountCents: Number(penaltyThresholdCents),
                  thresholdExceeded: penaltyThresholdExceeded,
                  thresholdWarningNote: penaltyWarningNote.trim() || undefined,
                })
              }
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
