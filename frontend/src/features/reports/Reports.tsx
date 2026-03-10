import { useState } from 'react';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useDashboardStats } from '@/hooks/useDashboard';
import { formatRands } from '@/utils/formatters';
import { Download, DollarSign, TrendingDown, Wallet, FileText, History, TrendingUp } from 'lucide-react';
import PaymentHistory from './PaymentHistory';
import PaymentForecast from './PaymentForecast';

type ReportsTab = 'overview' | 'payment-history' | 'payment-forecast';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<ReportsTab>('overview');
  const { data: dashboardData, isLoading } = useDashboardStats();

  const stats = dashboardData?.stats;

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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {['Sprint Burndown', 'Project Completion', 'Team Velocity', 'Budget Breakdown'].map((chart) => (
                  <div key={chart} className="bg-[var(--bg-card)] border border-[var(--border)]">
                    <div className="px-6 py-4 border-b border-[var(--border)]">
                      <h3 className="text-h3">{chart}</h3>
                    </div>
                    <div className="flex items-center justify-center py-20">
                      <p className="text-[var(--text-muted)] text-sm">
                        Recharts integration — Sprint 6
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
