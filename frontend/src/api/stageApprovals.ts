import apiClient from './client';
import { useTenantStore } from '@/store/tenantStore';
import type { StageApproval, ApiResponse } from '@/types';

function slug() {
  return useTenantStore.getState().getSlug() || '';
}

export const stageApprovalsApi = {
  list: async (projectId: string): Promise<StageApproval[]> => {
    const res = await apiClient.get<ApiResponse<StageApproval[]>>(`/${slug()}/projects/${projectId}/approvals`);
    const data = res.data?.data;
    return Array.isArray(data) ? data : (data as Record<string, unknown>)?.approvals as StageApproval[] || [];
  },

  pending: async (projectId: string): Promise<StageApproval[]> => {
    const res = await apiClient.get<ApiResponse<StageApproval[]>>(`/${slug()}/projects/${projectId}/approvals/pending`);
    const data = res.data?.data;
    return Array.isArray(data) ? data : (data as Record<string, unknown>)?.approvals as StageApproval[] || [];
  },

  getById: async (projectId: string, approvalId: string): Promise<StageApproval> => {
    const res = await apiClient.get<ApiResponse<{ approval: StageApproval }>>(`/${slug()}/projects/${projectId}/approvals/${approvalId}`);
    return res.data.data.approval;
  },

  approve: async (projectId: string, approvalId: string): Promise<void> => {
    await apiClient.post(`/${slug()}/projects/${projectId}/approvals/${approvalId}/approve`);
  },

  reject: async (projectId: string, approvalId: string, reason: string): Promise<void> => {
    await apiClient.post(`/${slug()}/projects/${projectId}/approvals/${approvalId}/reject`, { reason });
  },
};
