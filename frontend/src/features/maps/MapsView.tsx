import { MapPin } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import EmptyState from '@/components/ui/EmptyState';
import { useProjects } from '@/hooks/useProjects';
import { formatRands } from '@/utils/formatters';

type BadgeStatus = 'active' | 'review' | 'planning' | 'done' | 'danger' | 'accent';

function projectStatusToBadge(status: string): { badge: BadgeStatus; label: string } {
  switch (status) {
    case 'active': return { badge: 'active', label: 'Active' };
    case 'in_review': return { badge: 'review', label: 'In Review' };
    case 'not_started': return { badge: 'planning', label: 'Not Started' };
    case 'complete': return { badge: 'done', label: 'Complete' };
    case 'overdue': return { badge: 'danger', label: 'Overdue' };
    default: return { badge: 'planning', label: status };
  }
}

export default function MapsView() {
  const { data: projectsResponse, isLoading, error } = useProjects();
  const projects = projectsResponse?.data ?? [];

  if (isLoading) {
    return (
      <div className="min-h-[400px] relative">
        <LoadingOverlay fullscreen={false} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-[0.82rem] text-[var(--status-danger)]">
          Failed to load projects.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in -mx-6 lg:-mx-[5rem] -mt-20 -mb-12">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-[320px] bg-[var(--bg-secondary)] border-r border-[var(--border)] overflow-y-auto pt-20">
          <div className="px-4 py-4 border-b border-[var(--border)]">
            <h2 className="text-h3 mb-3">Projects</h2>
            <select className="w-full bg-transparent border border-[var(--border)] px-3 py-2 text-[0.78rem] font-body text-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none">
              <option className="bg-[var(--bg-card)]">All Statuses</option>
              <option className="bg-[var(--bg-card)]">Active</option>
              <option className="bg-[var(--bg-card)]">In Review</option>
              <option className="bg-[var(--bg-card)]">Not Started</option>
              <option className="bg-[var(--bg-card)]">Complete</option>
            </select>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {projects.length === 0 ? (
              <EmptyState title="No projects." className="py-8" animationClassName="w-20 h-20" />
            ) : (
              projects.map((p) => (
                <button
                  key={p.id}
                  className="w-full text-left px-4 py-3 hover:bg-[var(--accent-glow)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-[0.82rem] font-body font-medium text-[var(--text-primary)]">
                      {p.name}
                    </p>
                  <StatusBadge status={projectStatusToBadge(p.status).badge}>
                    {projectStatusToBadge(p.status).label}
                  </StatusBadge>
                  </div>
                  <p className="text-currency text-[0.82rem]">{formatRands(p.contractValue)}</p>
                  {!p.gpsLatitude && !p.gpsLongitude && (
                    <p className="text-[0.6rem] text-[var(--text-muted)] mt-1">No GPS</p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Map area */}
        <div className="flex-1 bg-[var(--bg-primary)] flex items-center justify-center pt-16">
          <div className="text-center">
            <MapPin className="h-16 w-16 text-[var(--accent-dim)] mx-auto mb-4" />
            <h3 className="text-h3 mb-2">Google Maps Integration</h3>
            <p className="text-body max-w-md">
              Provide VITE_GOOGLE_MAPS_API_KEY to enable the interactive map with custom dark/night
              styling and gold project markers. Implementation in Sprint 6.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
