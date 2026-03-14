import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import PaymentForecastChart from '@/components/ui/PaymentForecastChart';
import { useDashboardStats } from '@/hooks/useDashboard';
import { reportsApi } from '@/api/reports';
import { formatRands } from '@/utils/formatters';
import { Download, DollarSign, TrendingDown, Wallet, FileText, History, TrendingUp, PieChartIcon } from 'lucide-react';
import PaymentHistory from './PaymentHistory';
import PaymentForecast from './PaymentForecast';

type ReportsTab = 'overview' | 'payment-history' | 'payment-forecast';

const STATUS_COLORS: Record<string, string> = {
  active: '#C9A961',
  in_review: '#2DD4BF',
  not_started: '#6B7280',
  complete: '#22C55E',
  overdue: '#EF4444',
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState<ReportsTab>('overview');
  const { data: dashboardData, isLoading } = useDashboardStats();

  const { data: mtefData } = useQuery({
    queryKey: ['reports', 'mtef'],
    queryFn: () => reportsApi.getMtefSummary(),
    enabled: activeTab === 'overview',
  });

  const { data: projectStatusData } = useQuery({
    queryKey: ['reports', 'project-status'],
    queryFn: () => reportsApi.getProjectStatus(),
    enabled: activeTab === 'overview',
  });

  const { data: forecastReportData } = useQuery({
    queryKey: ['reports', 'payment-forecast-report'],
    queryFn: () => reportsApi.getPaymentForecast(),
    enabled: activeTab === 'overview',
  });

  const stats = dashboardData?.stats;

  const handleExport = async () => {
    try {
      const result = await reportsApi.generateReport();
      const blob = await reportsApi.downloadReport(result.reportId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${result.reportId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* handled by interceptor */ }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-h1">Reports</h1>
        <Button variant="primary" onClick={handleExport}>
          <Download className="h-3.5 w-3.5" />
          Export Report
        </Button>
      </div>

      <div className="flex items-center gap-0 border-b border-[var(--border)] mb-8">
        {([
          { key: 'overview' as const, label: 'Overview', icon: <FileText className="h-3.5 w-3.5" /> },
          { key: 'payment-history' as const, label: 'Payment History', icon: <History className="h-3.5 w-3.5" /> },
          { key: 'payment-forecast' as const, label: 'Payment Forecast', icon: <TrendingUp className="h-3.5 w-3.5" /> },
        ]).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={[
              'text-button inline-flex items-center gap-2 px-6 py-3 transition-all duration-300',
              activeTab === tab.key
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            ].join(' ')}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'payment-history' && <PaymentHistory />}
      {activeTab === 'payment-forecast' && <PaymentForecast />}

      {activeTab === 'overview' && (
        <>
          {isLoading ? (
            <div className="min-h-[200px] relative">
              <LoadingOverlay fullscreen={false} />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 mb-10">
                <StatCard label="Allocated" value={formatRands(stats?.portfolioValue ?? 0)} icon={<DollarSign className="h-5 w-5" />} isCurrency />
                <StatCard label="Spent" value={formatRands(stats?.expenditureToDate ?? 0)} icon={<TrendingDown className="h-5 w-5" />} isCurrency />
                <StatCard label="Remaining" value={formatRands((stats?.portfolioValue ?? 0) - (stats?.expenditureToDate ?? 0))} icon={<Wallet className="h-5 w-5" />} isCurrency />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* MTEF Budget Panel */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)]">
                  <div className="px-6 py-4 border-b border-[var(--border)]">
                    <h3 className="text-h3">MTEF Budget Overview</h3>
                  </div>
                  <div className="p-6">
                    {mtefData ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={[
                          { year: 'Year 1', budget: mtefData.year1.budget, spent: mtefData.year1.spent },
                          { year: 'Year 2', budget: mtefData.year2.budget, spent: mtefData.year2.spent },
                          { year: 'Year 3', budget: mtefData.year3.budget, spent: mtefData.year3.spent },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="year" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(v) => `R${(v/1000).toFixed(0)}k`} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 0 }}
                            labelStyle={{ color: 'var(--text-primary)' }}
                            formatter={(value: number) => [formatRands(value), '']}
                          />
                          <Bar dataKey="budget" fill="#C9A961" name="Budget" />
                          <Bar dataKey="spent" fill="#2DD4BF" name="Spent" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-[var(--text-muted)] text-sm text-center py-16">Loading MTEF data...</p>
                    )}
                  </div>
                </div>

                {/* Project Status Distribution */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)]">
                  <div className="px-6 py-4 border-b border-[var(--border)]">
                    <h3 className="text-h3">Project Status</h3>
                  </div>
                  <div className="p-6">
                    {projectStatusData && projectStatusData.distribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={projectStatusData.distribution}
                            dataKey="count"
                            nameKey="status"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ status, percentage }) => `${status} (${percentage}%)`}
                          >
                            {projectStatusData.distribution.map((entry) => (
                              <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#6B7280'} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 0 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                          <PieChartIcon className="h-8 w-8 text-[var(--accent-dim)] mx-auto mb-2" />
                          <p className="text-[var(--text-muted)] text-sm">No project data</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Forecast Chart */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] lg:col-span-2">
                  <div className="px-6 py-4 border-b border-[var(--border)]">
                    <h3 className="text-h3">Annual Payment Forecast vs Actual</h3>
                  </div>
                  <div className="p-6">
                    {forecastReportData && forecastReportData.length > 0 ? (
                      <PaymentForecastChart
                        forecastData={forecastReportData.map((f) => ({
                          month: f.month,
                          amount: f.forecast,
                        }))}
                        actualData={forecastReportData.map((f) => ({
                          month: f.month,
                          amount: f.actual,
                        }))}
                        title="Annual Forecast vs Actual"
                      />
                    ) : (
                      <p className="text-[var(--text-muted)] text-sm text-center py-16">No forecast data available</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
