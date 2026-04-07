import { AxiosError } from 'axios';
import type { ProjectStage } from '@/types';
import { STAGE_DOCUMENT_REQUIREMENTS } from '@/constants/stageDocuments';

export interface MockStageMissingDoc {
  documentName: string;
  category: string;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let mockCurrentStage: ProjectStage = 4;
/** When true, requirement index is still outstanding for the gate. */
let pending: boolean[] = [];

function reqs(stage: ProjectStage) {
  return STAGE_DOCUMENT_REQUIREMENTS[stage];
}

function ensurePendingLength(stage: ProjectStage) {
  const list = reqs(stage);
  if (pending.length !== list.length) {
    pending = list.map((_, i) => i >= 2);
  }
}

export function getMockStageStatus(): {
  currentStage: ProjectStage;
  gatePassed: boolean;
  missing: MockStageMissingDoc[];
} {
  ensurePendingLength(mockCurrentStage);
  const list = reqs(mockCurrentStage);
  const missing: MockStageMissingDoc[] = list
    .map((r, i) => (pending[i] ? { documentName: r.documentName, category: r.category } : null))
    .filter((v): v is MockStageMissingDoc => v != null);
  return {
    currentStage: mockCurrentStage,
    gatePassed: missing.length === 0,
    missing,
  };
}

export function markMockStageRequirementSatisfied(params: { documentName: string; category: string }) {
  ensurePendingLength(mockCurrentStage);
  const list = reqs(mockCurrentStage);
  const idx = list.findIndex(
    (r) => r.documentName === params.documentName && r.category === params.category,
  );
  if (idx >= 0) pending[idx] = false;
}

export function advanceMockStageOrThrow(): void {
  ensurePendingLength(mockCurrentStage);
  const list = reqs(mockCurrentStage);
  const missing: MockStageMissingDoc[] = list
    .map((r, i) => (pending[i] ? { documentName: r.documentName, category: r.category } : null))
    .filter((v): v is MockStageMissingDoc => v != null);

  if (missing.length > 0) {
    const err = new AxiosError('Request failed with status code 422');
    err.response = {
      status: 422,
      statusText: 'Unprocessable Entity',
      data: {
        success: false,
        error: 'STAGE_GATE_FAILED',
        stage: mockCurrentStage,
        missing,
      },
      headers: {},
      config: {} as never,
    };
    throw err;
  }

  if (mockCurrentStage < 6) {
    mockCurrentStage = (mockCurrentStage + 1) as ProjectStage;
    const next = reqs(mockCurrentStage);
    pending = next.map((_, i) => i >= 2);
  }
}

export { delay };
