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

function emptyOverview(): ReportsOverviewResponse {
  return {
    kpis: { allocated: 0, spent: 0, remaining: 0 },
    departments: [],
    grants: { totalValue: 0, disbursedToDate: 0, remaining: 0 },
    serviceCategories: [],
  };
}

function normalizeOverviewResponse(raw: unknown): ReportsOverviewResponse {
  if (!raw || typeof raw !== 'object') return emptyOverview();
  const candidate = raw as Partial<ReportsOverviewResponse> & {
    budget?: { totalBudget?: unknown; totalExpenditure?: unknown; remainingBudget?: unknown };
    grants?: { totalGrantValue?: unknown; totalDisbursed?: unknown };
    departments?: Array<{
      deptName?: unknown;
      fullName?: unknown;
      name?: unknown;
      totalBudget?: unknown;
      budget?: unknown;
      spent?: unknown;
      totalExpenditure?: unknown;
      remaining?: unknown;
    }>;
  };

  if (candidate.kpis && candidate.departments && candidate.serviceCategories) {
    const departments =
      Array.isArray(candidate.departments)
        ? (candidate.departments as Array<{
            deptName?: unknown;
            fullName?: unknown;
            name?: unknown;
            totalBudget?: unknown;
            budget?: unknown;
            spent?: unknown;
            totalExpenditure?: unknown;
            remaining?: unknown;
          }>)
        : [];
    return {
      kpis: {
        allocated: Number(candidate.kpis.allocated) || 0,
        spent: Number(candidate.kpis.spent) || 0,
        remaining: Number(candidate.kpis.remaining) || 0,
      },
      departments: departments.map((dept) => ({
            deptName: String(dept.deptName || dept.fullName || dept.name || 'Unknown'),
            totalBudget: Number(dept.totalBudget ?? dept.budget) || 0,
            spent: Number(dept.spent ?? dept.totalExpenditure) || 0,
            remaining: Number(dept.remaining) || 0,
          })),
      grants: {
        totalValue: Number(candidate.grants?.totalValue) || 0,
        disbursedToDate: Number(candidate.grants?.disbursedToDate) || 0,
        remaining: Number(candidate.grants?.remaining) || 0,
      },
      serviceCategories: Array.isArray(candidate.serviceCategories) ? candidate.serviceCategories : [],
    };
  }

  const budget = candidate.budget;
  const grantTotals = candidate.grants;
  return {
    kpis: {
      allocated: Number(budget?.totalBudget) || 0,
      spent: Number(budget?.totalExpenditure) || 0,
      remaining: Number(budget?.remainingBudget) || 0,
    },
    departments: [],
    grants: {
      totalValue: Number(grantTotals?.totalGrantValue) || 0,
      disbursedToDate: Number(grantTotals?.totalDisbursed) || 0,
      remaining:
        Math.max(
          0,
          (Number(grantTotals?.totalGrantValue) || 0) - (Number(grantTotals?.totalDisbursed) || 0),
        ),
    },
    serviceCategories: [],
  };
}

export async function fetchReportsOverview(): Promise<ReportsOverviewResponse> {
  const res = await apiClient.get(`/${slug()}/reports/dashboard`);
  const data = res.data?.data || res.data;
  return normalizeOverviewResponse(data);
}

export async function fetchDeptSummary(deptId?: string) {
  const res = await apiClient.get(`/${slug()}/reports/dept-summary`, { params: { deptId } });
  return res.data?.data || res.data;
}

export async function fetchPaymentForecastReport() {
  const res = await apiClient.get(`/${slug()}/reports/payment-forecast`);
  return res.data?.data || res.data;
}

export async function fetchGrantsSummaryReport() {
  const res = await apiClient.get(`/${slug()}/reports/grants-summary`);
  return res.data?.data || res.data;
}
