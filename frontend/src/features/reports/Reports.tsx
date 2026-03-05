import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import { formatRands } from '@/utils/formatters';
import { Download, DollarSign, TrendingDown, Wallet } from 'lucide-react';

export default function Reports() {
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-h1">Reports</h1>
        <Button variant="primary">
          <Download className="h-3.5 w-3.5" />
          Export Report
        </Button>
      </div>

      {/* Budget overview stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 mb-10">
        <StatCard label="Allocated" value={formatRands(185000000)} icon={<DollarSign className="h-5 w-5" />} isCurrency />
        <StatCard label="Spent" value={formatRands(72500000)} icon={<TrendingDown className="h-5 w-5" />} isCurrency />
        <StatCard label="Remaining" value={formatRands(112500000)} icon={<Wallet className="h-5 w-5" />} isCurrency />
      </div>

      {/* Chart placeholders */}
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
    </div>
  );
}
