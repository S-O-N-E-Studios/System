import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, Droplets, Zap, Route, Trash2, Trophy, Bus } from 'lucide-react';
import ProgressBar from './ProgressBar';
import StatusBadge from './StatusBadge';
import { formatRands } from '@/utils/formatters';
import { SERVICE_CATEGORY_LABELS, type ServiceCategory, type Project } from '@/types';

const CATEGORY_ICONS: Record<ServiceCategory, React.ComponentType<{ className?: string }>> = {
  water_sanitation: Droplets,
  energy_electricity: Zap,
  roads_stormwater: Route,
  waste_management: Trash2,
  recreational_sport_libraries: Trophy,
  public_transportation: Bus,
};

interface ServiceCategoryCardProps {
  category: ServiceCategory;
  projectCount: number;
  totalBudget: number;
  totalExpenditure: number;
  projects: Project[];
}

export default function ServiceCategoryCard({
  category,
  projectCount,
  totalBudget,
  totalExpenditure,
  projects,
}: ServiceCategoryCardProps) {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [expanded, setExpanded] = useState(false);
  const Icon = CATEGORY_ICONS[category];
  const percentSpent = totalBudget > 0 ? (totalExpenditure / totalBudget) * 100 : 0;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-6 text-left hover:bg-[var(--accent-sand-glow)] transition-colors"
      >
        <div className="w-12 h-12 flex items-center justify-center bg-[var(--accent-lavender)]/30 border border-[var(--accent-periwinkle)]/30">
          <Icon className="h-6 w-6 text-[var(--accent-periwinkle)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-h3 mb-1">{SERVICE_CATEGORY_LABELS[category]}</h3>
          <div className="flex items-center gap-4 text-[0.78rem] text-[var(--text-muted)]">
            <span>{projectCount} project{projectCount !== 1 ? 's' : ''}</span>
            <span className="text-financial" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {formatRands(totalBudget)} total
            </span>
            <span className="text-financial" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {formatRands(totalExpenditure)} spent
            </span>
          </div>
          <div className="mt-3 w-full max-w-[200px]">
            <ProgressBar value={percentSpent} height={4} />
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-[var(--text-muted)] shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-[var(--text-muted)] shrink-0" />
        )}
      </button>

      {expanded && projects.length > 0 && (
        <div className="border-t border-[var(--border-default)]">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--table-header-bg)' }}>
                <th className="text-table-header text-left px-4 py-2">Project</th>
                <th className="text-table-header text-left px-4 py-2">Local Municipality</th>
                <th className="text-table-header text-right px-4 py-2">Budget</th>
                <th className="text-table-header text-left px-4 py-2">Stage</th>
                <th className="text-table-header text-left px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p, i) => (
                <tr
                  key={p.id}
                  className={[
                    'border-b border-[var(--border-default)] last:border-0',
                    i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-surface)]',
                  ].join(' ')}
                >
                  <td className="px-4 py-2">
                    <Link
                      to={`/${tenantSlug}/projects/${p.id}`}
                      className="text-[0.82rem] font-medium text-[var(--accent-periwinkle)] hover:underline"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-[0.78rem] text-[var(--text-muted)]">
                    {p.localMunicipality || 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-right text-financial text-[0.78rem]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {formatRands(p.contractValue)}
                  </td>
                  <td className="px-4 py-2 text-[0.78rem]">
                    {p.currentStage != null ? `Stage ${p.currentStage}` : 'N/A'}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={p.status === 'active' ? 'active' : p.status === 'complete' ? 'done' : 'planning'}>
                      {p.status}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
