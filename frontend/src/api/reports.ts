import apiClient from './client';
import { useTenantStore } from '@/store/tenantStore';

function slug() {
  return useTenantStore.getState().getSlug() || '';
}

export interface DashboardKpiSummary {
  allocated: number;
  spent: number;
  remaining: number;
}

export interface DeptBudgetSummary {
  deptName: string;
  totalBudget: number;
  spent: number;
  remaining: number;
}

export interface GrantsReportSummary {
  totalValue: number;
  disbursedToDate: number;
  remaining: number;
}

export interface ServiceCategoryBreakdownItem {
  category: string;
  totalValue: number;
  disbursedToDate: number;
  remaining: number;
}

export interface ReportsOverviewResponse {
  kpis: DashboardKpiSummary;
  departments: DeptBudgetSummary[];
  grants: GrantsReportSummary;
  serviceCategories: ServiceCategoryBreakdownItem[];
}

export async function fetchReportsOverview(): Promise<ReportsOverviewResponse> {
  try {
    const res = await apiClient.get(`/${slug()}/reports/dashboard`);
    const data = res.data?.data || res.data;
    return data as ReportsOverviewResponse;
  } catch {
    return {
      kpis: { allocated: 0, spent: 0, remaining: 0 },
      departments: [],
      grants: { totalValue: 0, disbursedToDate: 0, remaining: 0 },
      serviceCategories: [],
    };
  }
}

export async function fetchDeptSummary(deptId?: string) {
  try {
    const res = await apiClient.get(`/${slug()}/reports/dept-summary`, { params: { deptId } });
    return res.data?.data || res.data;
  } catch {
    return {};
  }
}

export async function fetchPaymentForecastReport() {
  try {
    const res = await apiClient.get(`/${slug()}/reports/payment-forecast`);
    return res.data?.data || res.data;
  } catch {
    return {};
  }
}

export async function fetchGrantsSummaryReport() {
  try {
    const res = await apiClient.get(`/${slug()}/reports/grants-summary`);
    return res.data?.data || res.data;
  } catch {
    return {};
  }
}
