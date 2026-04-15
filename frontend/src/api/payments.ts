import apiClient from './client';
import type { PaymentHistoryEntry, PaginatedResponse } from '@/types';

interface PaymentHistoryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  projectId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const paymentsApi = {
  listPaymentHistory: async (params?: PaymentHistoryParams): Promise<PaginatedResponse<PaymentHistoryEntry>> => {
    const res = await apiClient.get<PaginatedResponse<PaymentHistoryEntry>>('/payments/history', { params });
    return res.data;
  },
};
