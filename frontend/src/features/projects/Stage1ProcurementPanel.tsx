import Button from '@/components/ui/Button';
import type { ProcurementStepStatus, ProcurementTrail } from '@/api/workflow';
import { procurementStepStatusLabel } from '@/utils/statusLabels';

const STEP_KEYS = ['advert', 'recommendations', 'approval', 'appointment_letter', 'sla'] as const;

function prettyLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

type Props = {
  expanded: boolean;
  onToggle: () => void;
  missingAppointmentTypes: string[];
  trails: ProcurementTrail[];
  isLoading: boolean;
  canConsultantProcurement: boolean;
  canReviewProcurement: boolean;
  onAddTrail: (appointmentType: string) => void;
  isAddingTrail: boolean;
  onWarn: (message: string) => void;
  onSelectStepStatus: (payload: {
    trailId: string;
    stepKey: (typeof STEP_KEYS)[number];
    status: ProcurementStepStatus;
    reason?: string;
  }) => void;
};

export default function Stage1ProcurementPanel({
  expanded,
  onToggle,
  missingAppointmentTypes,
  trails,
  isLoading,
  canConsultantProcurement,
  canReviewProcurement,
  onAddTrail,
  isAddingTrail,
  onWarn,
  onSelectStepStatus,
}: Props) {
  return (
    <div className="border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-4 space-y-4">
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 text-left"
        onClick={onToggle}
      >
        <div>
          <h4 className="text-h3 text-[0.95rem]">Sub-consultant procurement trails</h4>
          <p className="text-[0.72rem] text-[var(--text-muted)]">
            Each appointment follows Advert, Recommendations, Approval, Appointment Letter, and SLA. Consultants mark
            steps Not applicable where a role is not required; client approvers record Approved or Not approved.
          </p>
        </div>
        <span className="text-[0.68rem] text-[var(--text-muted)]">
          {expanded ? 'Hide' : 'Show'}
        </span>
      </button>

      {expanded && (
        <>
          {missingAppointmentTypes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {missingAppointmentTypes.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant="secondary"
                  className="!py-1.5 !px-2.5 !text-[0.68rem]"
                  onClick={() => onAddTrail(type)}
                  isLoading={isAddingTrail}
                >
                  Add {prettyLabel(type)}
                </Button>
              ))}
            </div>
          )}

          {isLoading ? (
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
                                  onWarn('Only client approvers can mark steps approved or not approved.');
                                  return;
                                }
                                if (!canConsultantProcurement && nextStatus === 'not_applicable') {
                                  onWarn('Only the consulting team can mark a step as not applicable.');
                                  return;
                                }
                                onSelectStepStatus({
                                  trailId: trail._id,
                                  stepKey,
                                  status: nextStatus,
                                  reason: step?.reason || undefined,
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
  );
}
