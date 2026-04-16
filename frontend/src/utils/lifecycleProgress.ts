import type { ProjectStage } from '@/types';

const MAX_LIFECYCLE_STAGE: ProjectStage = 10;

export function progressFromLifecycleStage(stageLike: unknown): number {
  const stage = Number(stageLike);
  if (!Number.isFinite(stage)) return 0;
  const bounded = Math.min(MAX_LIFECYCLE_STAGE, Math.max(0, Math.round(stage)));
  return Math.round((bounded / MAX_LIFECYCLE_STAGE) * 100);
}
