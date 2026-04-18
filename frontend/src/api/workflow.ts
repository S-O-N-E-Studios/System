import apiClient from './client';
import { useTenantStore } from '@/store/tenantStore';

function slug() {
  return useTenantStore.getState().getSlug() || '';
}

const isNotFound = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'response' in error &&
  typeof (error as { response?: { status?: number } }).response?.status === 'number' &&
  (error as { response?: { status?: number } }).response?.status === 404;

export type TopLevelStage = {
  id: number;
  key: string;
  label: string;
};

export type WorkflowSummary = {
  projectId: string;
  stageTopLevel: number;
  stageCheckpoint: string;
  topLevelStages: TopLevelStage[];
  legacyStage?: number;
  gateRequirements?: WorkflowGateRequirement[];
  canAdvance?: boolean;
};

export type WorkflowGateRequirement = {
  code: string;
  checkpoint: string;
  entityType: string;
  entityKey: string;
  detail: string;
};

export type ProcurementStepKey = 'advert' | 'recommendations' | 'approval' | 'appointment_letter' | 'sla';
export type ProcurementStepStatus = 'approved' | 'not_approved' | 'not_applicable';

export type ProcurementTrail = {
  _id: string;
  appointmentType: string;
  assignee?: {
    name?: string | null;
    firm?: string | null;
    contactEmail?: string | null;
  };
  isComplete: boolean;
  steps: Array<{
    stepKey: ProcurementStepKey;
    status: ProcurementStepStatus;
    reason?: string | null;
  }>;
};

export type PerformanceSnapshot = {
  _id: string;
  period: string;
  consultant: {
    rag: 'red' | 'amber' | 'green';
    progressProjectedPct: number;
    progressActualPct: number;
    expenditureProjectedPct: number;
    expenditureActualPct: number;
  };
  construction: {
    rag: 'red' | 'amber' | 'green';
    progressProjectedPct: number;
    progressActualPct: number;
    expenditureProjectedPct: number;
    expenditureActualPct: number;
    timeProjectedPct: number;
    timeActualPct: number;
  };
};

export type DerivedPerformanceMetrics = {
  period: string;
  consultant: PerformanceSnapshot['consultant'];
  construction: PerformanceSnapshot['construction'];
};

export type ExtensionOfTimeRequest = {
  _id: string;
  referenceNumber: string;
  reason: string;
  requestedDays: number;
  /** Present when approved; counted toward project completionDateAdjusted. */
  daysApproved?: number | null;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'withdrawn';
  rejectionReason?: string | null;
  assignedApproverId?: string | null;
  supportingFileIds?: string[];
  consultantRecommendationFileId?: string | null;
  pmuRecommendationFileId?: string | null;
  approvalFileId?: string | null;
  requestedDaysThreshold?: number | null;
  thresholdWarningNote?: string | null;
  thresholdExceeded?: boolean;
};

export type PenaltyRecord = {
  _id: string;
  penaltyType: 'delay' | 'quality' | 'contractual' | 'other';
  amountCents: number;
  reason: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'waived';
  rejectionReason?: string | null;
  assignedApproverId?: string | null;
  supportingFileIds?: string[];
  thresholdAmountCents?: number | null;
  thresholdWarningNote?: string | null;
  thresholdExceeded?: boolean;
};

export type AuditLogEntry = {
  _id: string;
  action: string;
  entityType: string;
  entityId?: string;
  actorName?: string | null;
  actorRole?: string | null;
  timestamp: string;
  overrideFlag?: boolean;
};

export const workflowApi = {
  getWorkflow: async (projectId: string): Promise<WorkflowSummary> => {
    const res = await apiClient.get(`/${slug()}/projects/${projectId}/workflow`);
    return res.data?.data || res.data;
  },

  advanceWorkflow: async (projectId: string) => {
    const res = await apiClient.post(`/${slug()}/projects/${projectId}/workflow/advance`);
    return res.data?.data || res.data;
  },

  listPerformance: async (projectId: string): Promise<{
    latest: PerformanceSnapshot | null;
    snapshots: PerformanceSnapshot[];
    derived: DerivedPerformanceMetrics | null;
  }> => {
    const res = await apiClient.get(`/${slug()}/projects/${projectId}/performance`);
    const body = res.data?.data || res.data;
    return {
      latest: body?.latest || null,
      snapshots: body?.snapshots || [],
      derived: body?.derived || null,
    };
  },

  upsertPerformance: async (
    projectId: string,
    payload: {
      period: string;
      consultant: {
        rag: 'red' | 'amber' | 'green';
        progressProjectedPct: number;
        progressActualPct: number;
        expenditureProjectedPct: number;
        expenditureActualPct: number;
      };
      construction: {
        rag: 'red' | 'amber' | 'green';
        progressProjectedPct: number;
        progressActualPct: number;
        expenditureProjectedPct: number;
        expenditureActualPct: number;
        timeProjectedPct: number;
        timeActualPct: number;
      };
    }
  ) => {
    const res = await apiClient.post(`/${slug()}/projects/${projectId}/performance/snapshots`, payload);
    return res.data?.data?.snapshot || res.data?.snapshot;
  },

  listProcurementTrails: async (projectId: string): Promise<ProcurementTrail[]> => {
    const res = await apiClient.get(`/${slug()}/projects/${projectId}/procurement-trails`);
    const body = res.data?.data || res.data;
    return body?.trails || [];
  },

  createProcurementTrail: async (projectId: string, payload: { appointmentType: string }) => {
    const res = await apiClient.post(`/${slug()}/projects/${projectId}/procurement-trails`, payload);
    return res.data?.data?.trail || res.data?.trail;
  },

  reviewProcurementStep: async (
    projectId: string,
    trailId: string,
    stepKey: ProcurementStepKey,
    payload: { status: ProcurementStepStatus; reason?: string }
  ) => {
    const res = await apiClient.post(
      `/${slug()}/projects/${projectId}/procurement-trails/${trailId}/steps/${stepKey}/review`,
      payload
    );
    return res.data?.data?.trail || res.data?.trail;
  },

  listExtensionOfTime: async (projectId: string): Promise<ExtensionOfTimeRequest[]> => {
    const canonicalPath = `/${slug()}/projects/${projectId}/eot`;
    const legacyPath = `/${slug()}/projects/${projectId}/extension-of-time`;
    try {
      const res = await apiClient.get(canonicalPath);
      const body = res.data?.data || res.data;
      return body?.requests || [];
    } catch (error) {
      if (!isNotFound(error)) throw error;
      const res = await apiClient.get(legacyPath);
      const body = res.data?.data || res.data;
      return body?.requests || [];
    }
  },

  approveExtensionOfTime: async (
    projectId: string,
    eotId: string,
    payload?: { daysApproved?: number }
  ) => {
    const canonicalPath = `/${slug()}/projects/${projectId}/eot/${eotId}/approve`;
    const legacyPath = `/${slug()}/projects/${projectId}/extension-of-time/${eotId}/approve`;
    try {
      const res = await apiClient.post(canonicalPath, payload ?? {});
      return res.data?.data?.request || res.data?.request;
    } catch (error) {
      if (!isNotFound(error)) throw error;
      const res = await apiClient.post(legacyPath, payload ?? {});
      return res.data?.data?.request || res.data?.request;
    }
  },

  submitExtensionOfTime: async (projectId: string, eotId: string) => {
    const canonicalPath = `/${slug()}/projects/${projectId}/eot/${eotId}/submit`;
    const legacyPath = `/${slug()}/projects/${projectId}/extension-of-time/${eotId}/submit`;
    try {
      const res = await apiClient.post(canonicalPath);
      return res.data?.data?.request || res.data?.request;
    } catch (error) {
      if (!isNotFound(error)) throw error;
      const res = await apiClient.post(legacyPath);
      return res.data?.data?.request || res.data?.request;
    }
  },

  rejectExtensionOfTime: async (projectId: string, eotId: string, payload: { reason: string }) => {
    const canonicalPath = `/${slug()}/projects/${projectId}/eot/${eotId}/reject`;
    const legacyPath = `/${slug()}/projects/${projectId}/extension-of-time/${eotId}/reject`;
    try {
      const res = await apiClient.post(canonicalPath, payload);
      return res.data?.data?.request || res.data?.request;
    } catch (error) {
      if (!isNotFound(error)) throw error;
      const res = await apiClient.post(legacyPath, payload);
      return res.data?.data?.request || res.data?.request;
    }
  },

  withdrawExtensionOfTime: async (projectId: string, eotId: string) => {
    const canonicalPath = `/${slug()}/projects/${projectId}/eot/${eotId}/withdraw`;
    const legacyPath = `/${slug()}/projects/${projectId}/extension-of-time/${eotId}/withdraw`;
    try {
      const res = await apiClient.post(canonicalPath);
      return res.data?.data?.request || res.data?.request;
    } catch (error) {
      if (!isNotFound(error)) throw error;
      const res = await apiClient.post(legacyPath);
      return res.data?.data?.request || res.data?.request;
    }
  },

  createExtensionOfTime: async (
    projectId: string,
    payload: {
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
    }
  ) => {
    const canonicalPath = `/${slug()}/projects/${projectId}/eot`;
    const legacyPath = `/${slug()}/projects/${projectId}/extension-of-time`;
    try {
      const res = await apiClient.post(canonicalPath, payload);
      return res.data?.data?.request || res.data?.request;
    } catch (error) {
      if (!isNotFound(error)) throw error;
      const res = await apiClient.post(legacyPath, payload);
      return res.data?.data?.request || res.data?.request;
    }
  },

  listPenalties: async (projectId: string): Promise<PenaltyRecord[]> => {
    const res = await apiClient.get(`/${slug()}/projects/${projectId}/penalties`);
    const body = res.data?.data || res.data;
    return body?.penalties || [];
  },

  createPenalty: async (
    projectId: string,
    payload: {
      penaltyType: PenaltyRecord['penaltyType'];
      amountCents: number;
      reason: string;
      supportingFileIds?: string[];
      assignedApproverId?: string;
      thresholdAmountCents?: number;
      thresholdExceeded?: boolean;
      thresholdWarningNote?: string;
    }
  ) => {
    const res = await apiClient.post(`/${slug()}/projects/${projectId}/penalties`, payload);
    return res.data?.data?.penalty || res.data?.penalty;
  },

  submitPenalty: async (projectId: string, penaltyId: string) => {
    const res = await apiClient.post(`/${slug()}/projects/${projectId}/penalties/${penaltyId}/submit`);
    return res.data?.data?.penalty || res.data?.penalty;
  },

  approvePenalty: async (projectId: string, penaltyId: string) => {
    const res = await apiClient.post(`/${slug()}/projects/${projectId}/penalties/${penaltyId}/approve`);
    return res.data?.data?.penalty || res.data?.penalty;
  },

  rejectPenalty: async (projectId: string, penaltyId: string, payload: { reason: string }) => {
    const res = await apiClient.post(
      `/${slug()}/projects/${projectId}/penalties/${penaltyId}/reject`,
      payload
    );
    return res.data?.data?.penalty || res.data?.penalty;
  },

  waivePenalty: async (projectId: string, penaltyId: string) => {
    const res = await apiClient.post(`/${slug()}/projects/${projectId}/penalties/${penaltyId}/waive`);
    return res.data?.data?.penalty || res.data?.penalty;
  },

  listAuditLog: async (
    projectId: string,
    params?: {
      page?: number;
      limit?: number;
      action?: string;
      overrideOnly?: boolean;
      entityType?: string;
      actor?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<{ entries: AuditLogEntry[]; page: number; limit: number; total: number }> => {
    const res = await apiClient.get(`/${slug()}/projects/${projectId}/audit`, { params });
    const body = res.data?.data || res.data;
    return {
      entries: body?.entries || [],
      page: body?.page || 1,
      limit: body?.limit || 50,
      total: body?.total || 0,
    };
  },
};
