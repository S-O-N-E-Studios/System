import apiClient from './client';
import { useTenantStore } from '@/store/tenantStore';
import type { PaymentHistoryEntry, PaginatedResponse } from '@/types';

interface PaymentHistoryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  projectId?: string;
  dateFrom?: string;
  dateTo?: string;
}

function slug() {
  return useTenantStore.getState().getSlug() || '';
}

export const paymentsApi = {
  listPaymentHistory: async (params?: PaymentHistoryParams): Promise<PaginatedResponse<PaymentHistoryEntry>> => {
    const res = await apiClient.get(`/${slug()}/reports/payment-history`, { params });
    const rows = res.data?.data?.payments || [];
    return {
      data: rows,
      total: rows.length,
      page: 1,
      pageSize: rows.length || 1,
      totalPages: 1,
    };
  },
};
