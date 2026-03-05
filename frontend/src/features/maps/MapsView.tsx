import { MapPin } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';

const mockProjects = [
  { id: '1', name: 'Polokwane Water Treatment', status: 'active' as const, value: 'R 45,000,000', hasGps: true },
  { id: '2', name: 'Mokopane Road Rehabilitation', status: 'review' as const, value: 'R 32,000,000', hasGps: true },
  { id: '3', name: 'Tzaneen Bridge Construction', status: 'planning' as const, value: 'R 78,000,000', hasGps: true },
  { id: '4', name: 'Musina Wastewater Plant', status: 'active' as const, value: 'R 22,000,000', hasGps: false },
];

export default function MapsView() {
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
            {mockProjects.map((p) => (
              <button
                key={p.id}
                className="w-full text-left px-4 py-3 hover:bg-[var(--accent-glow)] transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-[0.82rem] font-body font-medium text-[var(--text-primary)]">
                    {p.name}
                  </p>
                  <StatusBadge status={p.status}>
                    {p.status === 'active' ? 'Active' : p.status === 'review' ? 'In Review' : 'New'}
                  </StatusBadge>
                </div>
                <p className="text-currency text-[0.82rem]">{p.value}</p>
                {!p.hasGps && (
                  <p className="text-[0.6rem] text-[var(--text-muted)] mt-1">No GPS</p>
                )}
              </button>
            ))}
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
