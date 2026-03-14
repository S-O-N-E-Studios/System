import apiClient from './client';
import type { ApiResponse } from '@/types';

export interface MtefSummary {
  year1: { budget: number; spent: number; remaining: number };
  year2: { budget: number; spent: number; remaining: number };
  year3: { budget: number; spent: number; remaining: number };
  total: { budget: number; spent: number };
}

export interface ProjectStatusDistribution {
  total: number;
  distribution: { status: string; count: number; percentage: number }[];
}

export interface PaymentForecastReportEntry {
  month: string;
  monthNum: number;
  year: number;
  forecast: number;
  actual: number;
}

export const reportsApi = {
  getMtefSummary: async (): Promise<MtefSummary> => {
    const res = await apiClient.get<ApiResponse<MtefSummary>>('/reports/mtef-summary');
    return res.data.data;
  },

  getProjectStatus: async (): Promise<ProjectStatusDistribution> => {
    const res = await apiClient.get<ApiResponse<ProjectStatusDistribution>>('/reports/project-status');
    return res.data.data;
  },

  getPaymentForecast: async (year?: number): Promise<PaymentForecastReportEntry[]> => {
    const params = year ? { year } : {};
    const res = await apiClient.get<ApiResponse<PaymentForecastReportEntry[]>>('/reports/payment-forecast', { params });
    return res.data.data;
  },

  getSprintBurndown: async (sprintId: string) => {
    const res = await apiClient.get('/reports/sprint-burndown', { params: { sprintId } });
    return res.data.data;
  },

  generateReport: async () => {
    const res = await apiClient.post('/reports/generate');
    return res.data.data;
  },

  downloadReport: async (reportId: string): Promise<Blob> => {
    const res = await apiClient.get(`/reports/${reportId}/download`, { responseType: 'blob' });
    return res.data;
  },
};
