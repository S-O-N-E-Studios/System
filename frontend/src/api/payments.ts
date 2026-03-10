import apiClient from './client';
import type { PaymentHistoryEntry, PaginatedResponse, ApiResponse } from '@/types';

interface PaymentHistoryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  projectId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ForecastPoint {
  month: string;
  amount: number;
}

export interface PaymentForecastData {
  forecast: ForecastPoint[];
  actual: ForecastPoint[];
}

export const paymentsApi = {
  listPaymentHistory: async (params?: PaymentHistoryParams): Promise<PaginatedResponse<PaymentHistoryEntry>> => {
    const res = await apiClient.get<PaginatedResponse<PaymentHistoryEntry>>('/payments/history', { params });
    return res.data;
  },

  getForecast: async (): Promise<PaymentForecastData> => {
    const res = await apiClient.get<ApiResponse<PaymentForecastData>>('/payments/forecast');
    return res.data.data;
  },
};
