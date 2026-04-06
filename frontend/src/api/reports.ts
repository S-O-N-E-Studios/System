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

export async function fetchReportsOverview() {
  const kpis: DashboardKpiSummary = {
    allocated: 185_000_000,
    spent: 72_500_000,
    remaining: 112_500_000,
  };

  const departments: DeptBudgetSummary[] = [
    { deptName: 'DPW', totalBudget: 95_000_000, spent: 42_000_000, remaining: 53_000_000 },
    { deptName: 'Transport', totalBudget: 60_000_000, spent: 18_000_000, remaining: 42_000_000 },
    { deptName: 'Education', totalBudget: 30_000_000, spent: 12_500_000, remaining: 17_500_000 },
  ];

  const grants: GrantsReportSummary = {
    totalValue: 330_000_000,
    disbursedToDate: 119_000_000,
    remaining: 211_000_000,
  };

  const serviceCategories: ServiceCategoryBreakdownItem[] = [
    { category: 'Water and Sanitation', totalValue: 90_000_000, disbursedToDate: 32_000_000, remaining: 58_000_000 },
    { category: 'Roads and Stormwater', totalValue: 75_000_000, disbursedToDate: 28_000_000, remaining: 47_000_000 },
    { category: 'Energy and Electricity', totalValue: 50_000_000, disbursedToDate: 19_000_000, remaining: 31_000_000 },
  ];

  return Promise.resolve({
    kpis,
    departments,
    grants,
    serviceCategories,
  });
}

