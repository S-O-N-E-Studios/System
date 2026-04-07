import StatusBadge from '@/components/ui/StatusBadge';
import AtlasMap from '@/components/ui/AtlasMap';
import { useMemo, useState } from 'react';
import { MAP_MOCK_PROJECTS } from '@/mocks/mapProjects';
import { formatRands } from '@/utils/formatters';

export default function MapsView() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    MAP_MOCK_PROJECTS[0]?.id ?? null,
  );

  const selected = useMemo(
    () => MAP_MOCK_PROJECTS.find((p) => p.id === selectedProjectId) ?? null,
    [selectedProjectId],
  );

  const markers = useMemo(() => {
    return MAP_MOCK_PROJECTS.filter(
      (p) => p.hasGps && typeof p.lat === 'number' && typeof p.lng === 'number',
    ).map((p) => ({
      id: p.id,
      lat: p.lat as number,
      lng: p.lng as number,
      label: p.name,
      status: p.status,
    }));
  }, []);

  const center =
    selected?.hasGps && typeof selected.lat === 'number' && typeof selected.lng === 'number'
      ? { lat: selected.lat, lng: selected.lng }
      : undefined;

  const zoom = selected?.hasGps ? 14 : 7;

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
            {MAP_MOCK_PROJECTS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                onMouseEnter={() => setSelectedProjectId(p.id)}
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
                <p className="text-currency text-[0.82rem]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {formatRands(p.contractValue)}
                </p>
                {!p.hasGps && (
                  <p className="text-[0.6rem] text-[var(--text-muted)] mt-1">No GPS</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Map area */}
        <div className="flex-1 bg-[var(--bg-primary)] flex items-center justify-center pt-16">
          <div className="w-full h-full px-6 lg:px-0 relative">
            <AtlasMap
              markers={markers}
              center={center}
              zoom={zoom}
              height="calc(100vh - 140px)"
              onMarkerClick={(m) => setSelectedProjectId(m.id)}
            />

            {selected && (
              <div className="absolute z-30 top-4 left-4 w-[340px] bg-[var(--bg-surface)] border border-[var(--border-default)] p-5 shadow-lg">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="text-h3 text-[1rem] mb-2 truncate">{selected.name}</h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <StatusBadge status={selected.status}>
                        {selected.status === 'active' ? 'Active' : selected.status === 'review' ? 'In Review' : 'Planning'}
                      </StatusBadge>
                      <span className="text-currency text-[0.92rem]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        {formatRands(selected.contractValue)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border)]">
                  <p className="text-[0.7rem] text-[var(--text-muted)] uppercase tracking-wider mb-1">Project Location</p>
                  <p className="text-[0.82rem] text-[var(--text-primary)] leading-relaxed">{selected.fullAddress}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
