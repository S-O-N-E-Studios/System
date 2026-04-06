import { CheckCircle2, AlertTriangle, FileCheck, ImageIcon } from 'lucide-react';
import type { CompletionGateStatus } from '@/types';
import Button from './Button';

interface CompletionGatePanelProps {
  gateStatus: CompletionGateStatus | null;
  isLoading?: boolean;
  onMarkComplete?: () => void;
}

export default function CompletionGatePanel({
  gateStatus,
  isLoading,
  onMarkComplete,
}: CompletionGatePanelProps) {
  if (isLoading || !gateStatus) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-6">
        <div className="skeleton h-5 w-48 mb-4" />
        <div className="skeleton h-4 w-64 mb-2" />
        <div className="skeleton h-4 w-56" />
      </div>
    );
  }

  const hasProofOfPayment = !gateStatus.missing.includes('proof_of_payment');
  const hasActivityImages = !gateStatus.missing.includes('activity_images');
  const allMet = gateStatus.gatePassed;

  const conditions = [
    {
      label: 'Proof of Payment',
      met: hasProofOfPayment,
      icon: FileCheck,
      description: hasProofOfPayment
        ? 'Proof of payment uploaded'
        : 'Upload proof of payment in the Files tab',
    },
    {
      label: 'Activity Supporting Images',
      met: hasActivityImages,
      icon: ImageIcon,
      description: hasActivityImages
        ? 'All completed activities have supporting images'
        : `${gateStatus.activities?.length ?? 0} completed ${
            (gateStatus.activities?.length ?? 0) === 1 ? 'activity' : 'activities'
          } missing supporting images`,
    },
  ];

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-h3">Completion Readiness</h3>
        {allMet ? (
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--status-success)]">
            Ready
          </span>
        ) : (
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--status-danger)]">
            Outstanding
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4 mb-6">
        {conditions.map((cond) => {
          const Icon = cond.icon;
          return (
            <div
              key={cond.label}
              className="flex items-start gap-3 py-3 border-b border-[var(--border-default)] last:border-0"
            >
              {cond.met ? (
                <CheckCircle2 className="h-5 w-5 text-[var(--status-success)] shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-[var(--status-danger)] shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[0.82rem] font-medium text-[var(--text-primary)]">{cond.label}</p>
                <p className="text-[0.72rem] text-[var(--text-muted)] mt-0.5">{cond.description}</p>
                {!cond.met && cond.label === 'Activity Supporting Images' && gateStatus.activities && (
                  <ul className="mt-2 flex flex-col gap-1">
                    {gateStatus.activities.map((a) => (
                      <li key={a.id} className="flex items-center gap-2 text-[0.68rem] text-[var(--status-danger)]">
                        <Icon className="h-3 w-3" />
                        {a.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {onMarkComplete && (
        <div className="relative group/btn inline-block">
          <Button
            variant="primary"
            onClick={onMarkComplete}
            disabled={!allMet}
            data-testid="mark-complete-btn"
          >
            Mark Complete
          </Button>
          {!allMet && (
            <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] text-[0.68rem] text-[var(--text-muted)] whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
              {gateStatus.missing.map((m) => m.replace(/_/g, ' ')).join(' & ')} required
            </div>
          )}
        </div>
      )}
    </div>
  );
}
