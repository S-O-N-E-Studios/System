import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import { formatRands } from '@/utils/formatters';
import { Download, DollarSign, TrendingDown, Wallet, FileText, History, TrendingUp } from 'lucide-react';
import PaymentHistory from './PaymentHistory';
import PaymentForecast from './PaymentForecast';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import { fetchReportsOverview } from '@/api/reports';

type ReportsTab = 'overview' | 'payment-history' | 'payment-forecast';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<ReportsTab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] =
    useState<Awaited<ReturnType<typeof fetchReportsOverview>> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchReportsOverview();
        if (!cancelled) setOverview(data);
      } catch {
        if (!cancelled) setError('Failed to load report overview.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-h1">Reports</h1>
        <Button variant="primary">
          <Download className="h-3.5 w-3.5" />
          Export Report
        </Button>
      </div>

      {/* Tab row */}
      <div className="flex items-center gap-0 border-b border-[var(--border)] mb-8">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={[
            'text-button inline-flex items-center gap-2 px-6 py-3 transition-all duration-300',
            activeTab === 'overview'
              ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
          ].join(' ')}
        >
          <FileText className="h-3.5 w-3.5" />
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('payment-history')}
          className={[
            'text-button inline-flex items-center gap-2 px-6 py-3 transition-all duration-300',
            activeTab === 'payment-history'
              ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
          ].join(' ')}
        >
          <History className="h-3.5 w-3.5" />
          Payment History
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('payment-forecast')}
          className={[
            'text-button inline-flex items-center gap-2 px-6 py-3 transition-all duration-300',
            activeTab === 'payment-forecast'
              ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
          ].join(' ')}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Payment Forecast
        </button>
      </div>

      {activeTab === 'payment-history' && <PaymentHistory />}
      {activeTab === 'payment-forecast' && <PaymentForecast />}

      {activeTab === 'overview' && (
        <div>
          {isLoading ? (
            <LoadingState
              title="Loading portfolio reports"
              description="Fetching dashboard KPIs and budget summaries."
            />
          ) : error ? (
            <ErrorState
              title="Unable to load overview"
              description="Please try again later."
            />
          ) : !overview ? (
            <EmptyState
              title="No reporting data yet."
              description="Reports will appear once projects, grants and payments are captured."
            />
          ) : (
            <>
              {/* Budget overview stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 mb-10">
                <StatCard
                  label="Allocated"
                  value={formatRands(overview.kpis.allocated)}
                  icon={<DollarSign className="h-5 w-5" />}
                  isCurrency
                />
                <StatCard
                  label="Spent"
                  value={formatRands(overview.kpis.spent)}
                  icon={<TrendingDown className="h-5 w-5" />}
                  isCurrency
                />
                <StatCard
                  label="Remaining"
                  value={formatRands(overview.kpis.remaining)}
                  icon={<Wallet className="h-5 w-5" />}
                  isCurrency
                />
              </div>

              {/* Simple department + service breakdown placeholders */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[var(--bg-card)] border border-[var(--border)]">
                  <div className="px-6 py-4 border-b border-[var(--border)]">
                    <h3 className="text-h3">Department Budgets</h3>
                  </div>
                  <div className="px-6 py-4 space-y-2">
                    {overview.departments.map((dept) => (
                      <div key={dept.deptName} className="flex items-center justify-between">
                        <span className="text-[0.8rem] text-[var(--text-primary)]">
                          {dept.deptName}
                        </span>
                        <span className="text-[0.75rem] text-financial">
                          {formatRands(dept.totalBudget)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border)]">
                  <div className="px-6 py-4 border-b border-[var(--border)]">
                    <h3 className="text-h3">Service Category Breakdown</h3>
                  </div>
                  <div className="px-6 py-4 space-y-2">
                    {overview.serviceCategories.map((item) => (
                      <div key={item.category} className="flex items-center justify-between">
                        <span className="text-[0.8rem] text-[var(--text-primary)]">
                          {item.category}
                        </span>
                        <span className="text-[0.75rem] text-financial">
                          {formatRands(item.totalValue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
