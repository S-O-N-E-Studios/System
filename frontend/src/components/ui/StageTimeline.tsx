import { Check } from 'lucide-react';
import { STAGE_NAMES, type ProjectStage } from '@/types';

interface StageTimelineProps {
  currentStage: ProjectStage;
  completedStages?: ProjectStage[];
  onStageClick?: (stage: ProjectStage) => void;
}

export default function StageTimeline({
  currentStage,
  completedStages = [],
  onStageClick,
}: StageTimelineProps) {
  const stages: ProjectStage[] = [1, 2, 3, 4, 5, 6];

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-6">
      <h3 className="text-h3 mb-6">Project Stage</h3>
      <div className="flex items-center gap-0 overflow-x-auto pb-2">
        {stages.map((stage, index) => {
          const isCompleted = completedStages.includes(stage) || stage < currentStage;
          const isCurrent = stage === currentStage;
          const isFuture = stage > currentStage;

          return (
            <div key={stage} className="flex items-center flex-1 min-w-0">
              <button
                type="button"
                onClick={() => onStageClick?.(stage)}
                className={[
                  'flex flex-col items-center gap-2 px-2 py-3 min-w-[80px] max-w-[120px] transition-all duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-periwinkle)]',
                  isCompleted &&
                    'text-[var(--status-success)] hover:bg-[var(--accent-sand-glow)]',
                  isCurrent &&
                    'text-[var(--accent-periwinkle)] bg-[var(--accent-lavender)]/20 hover:bg-[var(--accent-lavender)]/30',
                  isFuture && 'text-[var(--text-muted)] cursor-default',
                ]
                  .filter(Boolean)
                  .join(' ')}
                disabled={isFuture}
                data-testid={`stage-${stage}`}
              >
                <div
                  className={[
                    'w-10 h-10 flex items-center justify-center border-2 shrink-0',
                    isCompleted && 'border-[var(--status-success)] bg-[var(--status-success)]/10',
                    isCurrent &&
                      'border-[var(--accent-periwinkle)] bg-[var(--accent-periwinkle)]/10',
                    isFuture && 'border-[var(--border-default)] bg-[var(--bg-surface-alt)]',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 text-[var(--status-success)]" />
                  ) : (
                    <span
                      className={[
                        'text-[0.75rem] font-semibold',
                        isCurrent ? 'text-[var(--accent-periwinkle)]' : 'text-[var(--text-muted)]',
                      ].join(' ')}
                    >
                      {stage}
                    </span>
                  )}
                </div>
                <span
                  className={[
                    'text-[0.6rem] font-medium uppercase tracking-wider text-center line-clamp-2',
                    isCurrent && 'text-[var(--accent-periwinkle)]',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {STAGE_NAMES[stage]}
                </span>
              </button>
              {index < stages.length - 1 && (
                <div
                  className={[
                    'flex-1 h-0.5 min-w-[8px] mx-0',
                    isCompleted ? 'bg-[var(--status-success)]' : 'bg-[var(--border-default)]',
                  ].join(' ')}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
