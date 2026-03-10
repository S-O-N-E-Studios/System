import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import { formatRands } from '@/utils/formatters';
import { ArrowLeft, Edit, MapPin } from 'lucide-react';
import ProjectActivitySchedule from './ProjectActivitySchedule';

const detailTabs = ['Overview', 'Professional Services', 'Geo-Technical', 'Construction', 'Files', 'Activity'] as const;

export default function ProjectDetail() {
  const { tenantSlug, id } = useParams<{ tenantSlug: string; id: string }>();
  const [activeTab, setActiveTab] = useState<typeof detailTabs[number]>('Overview');

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link
          to={`/${tenantSlug}/projects`}
          className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-mono">PRJ-2026-001</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-h1 mb-1">Polokwane Water Treatment Upgrade</h1>
          <StatusBadge status="active">Active</StatusBadge>
        </div>
        <Link to={`/${tenantSlug}/projects/${id}/edit`}>
          <Button variant="secondary">
            <Edit className="h-3.5 w-3.5" />
            Edit Project
          </Button>
        </Link>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-0 border-b border-[var(--border)] mb-8 overflow-x-auto">
        {detailTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'text-button px-5 py-3 whitespace-nowrap transition-all duration-300',
              activeTab === tab
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-0">
            {[
              { label: 'Contract Value', value: formatRands(45000000), isCurrency: true },
              { label: 'Expenditure', value: formatRands(18200000), isCurrency: true },
              { label: 'Balance', value: formatRands(26800000), isCurrency: true },
              { label: '% Spent', value: '40%', isCurrency: false },
            ].map((kpi) => (
              <div key={kpi.label} className="p-6 border border-[var(--border)] bg-[var(--bg-card)]">
                <p className="text-eyebrow mb-2">{kpi.label}</p>
                <p className={kpi.isCurrency ? 'text-stat' : 'font-display text-[1.2rem] font-semibold text-[var(--text-primary)]'}>
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>

          {/* Map + Key Dates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6">
              <h3 className="text-h3 mb-4">Location</h3>
              <div className="aspect-video bg-[var(--bg-secondary)] border border-dashed border-[var(--border)] flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-8 w-8 text-[var(--accent-dim)] mx-auto mb-2" />
                  <p className="text-mono">-23.9045, 29.4688</p>
                  <p className="text-[0.65rem] text-[var(--text-muted)] mt-1">Google Maps embed requires API key</p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6">
              <h3 className="text-h3 mb-4">Key Information</h3>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Start Date', value: '15 Jan 2026' },
                  { label: 'Completion Date', value: '30 Nov 2026' },
                  { label: 'Project Manager', value: 'Fortune Mabona' },
                  { label: 'Contractor', value: 'BuildCorp SA' },
                  { label: 'Geo-Tec Engineer', value: 'Geoscience Ltd' },
                ].map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between py-2 border-b border-[var(--border)]">
                    <span className="text-[0.7rem] text-[var(--text-muted)]">{row.label}</span>
                    <span className="text-[0.82rem] text-[var(--text-primary)]">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <p className="text-eyebrow mb-3">Progress</p>
                <ProgressBar value={42} height={4} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity tab: Gantt-style schedule */}
      {activeTab === 'Activity' && <ProjectActivitySchedule />}

      {/* Placeholder for other tabs */}
      {activeTab !== 'Overview' && activeTab !== 'Activity' && (
        <div className="flex items-center justify-center py-20 border border-dashed border-[var(--border)]">
          <div className="text-center">
            <h3 className="text-h3 mb-2">{activeTab}</h3>
            <p className="text-body">This tab will be implemented in Sprint 4.</p>
          </div>
        </div>
      )}
    </div>
  );
}
