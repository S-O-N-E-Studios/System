import type { WorkflowGateRequirement } from '@/api/workflow';

type Props = {
  stageTopLevel: number;
  blockers: WorkflowGateRequirement[];
};

const STAGE_LABELS: Record<number, string> = {
  2: 'Project Planning Deliverables',
  3: 'Project Execution Deliverables',
  5: 'Project Closure Deliverables',
};

const isDeliverableLikeBlocker = (req: WorkflowGateRequirement) =>
  req.entityType === 'stage_document' || req.entityType === 'site_handover_evidence' || req.entityType === 'penalty';

export default function StageDeliverableGrid({ stageTopLevel, blockers }: Props) {
  if (![2, 3, 5].includes(stageTopLevel)) return null;
  const deliverableBlockers = blockers.filter(isDeliverableLikeBlocker);

  return (
    <div className="border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-4 space-y-3">
      <div>
        <h4 className="text-h3 text-[0.95rem]">{STAGE_LABELS[stageTopLevel]}</h4>
        <p className="text-[0.72rem] text-[var(--text-muted)]">
          Deliverable readiness for the current top-level stage gate.
        </p>
      </div>
      {deliverableBlockers.length === 0 ? (
        <p className="text-[0.74rem] text-[var(--status-success)]">
          All required deliverables are currently satisfied for this stage.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {deliverableBlockers.map((req) => (
            <div
              key={`${req.code}-${req.entityKey}`}
              className="border border-[var(--status-warning)]/40 bg-[var(--accent-sand-glow)] px-3 py-2"
            >
              <p className="text-[0.72rem] text-[var(--text-primary)]">{req.detail}</p>
              <p className="text-[0.64rem] text-[var(--text-muted)]">{req.entityKey}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
