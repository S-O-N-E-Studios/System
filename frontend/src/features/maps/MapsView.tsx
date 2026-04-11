import { useCallback, useMemo, useRef, useState } from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import AtlasMap from '@/components/ui/AtlasMap';
import { MAP_MOCK_PROJECTS } from '@/mocks/mapProjects';
import { formatRands } from '@/utils/formatters';
import { Search, MapPin, X } from 'lucide-react';

export default function MapsView() {
  // Persists on click — stays until another click or the ✕ button
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  // Transient hover — clears when mouse leaves the sidebar row OR the detail card
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [addressSearch, setAddressSearch] = useState('');

  // Timer ref to delay clearing hover so mouse can travel from sidebar → card
  const hoverClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelHoverClear = useCallback(() => {
    if (hoverClearTimer.current) {
      clearTimeout(hoverClearTimer.current);
      hoverClearTimer.current = null;
    }
  }, []);

  const scheduleHoverClear = useCallback(() => {
    cancelHoverClear();
    hoverClearTimer.current = setTimeout(() => setHoveredProjectId(null), 180);
  }, [cancelHoverClear]);

  // The "active" project is the hovered one, falling back to the clicked one
  const activeProjectId = hoveredProjectId ?? selectedProjectId;

  const activeProject = useMemo(
    () => MAP_MOCK_PROJECTS.find((p) => p.id === activeProjectId) ?? null,
    [activeProjectId],
  );

  const filteredProjects = useMemo(() => {
    let list = MAP_MOCK_PROJECTS;
    if (statusFilter) list = list.filter((p) => p.status === statusFilter);
    if (addressSearch.trim()) {
      const q = addressSearch.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.fullAddress.toLowerCase().includes(q),
      );
    }
    return list;
  }, [statusFilter, addressSearch]);

  const markers = useMemo(
    () =>
      MAP_MOCK_PROJECTS.filter(
        (p) => p.hasGps && typeof p.lat === 'number' && typeof p.lng === 'number',
      ).map((p) => ({
        id: p.id,
        lat: p.lat as number,
        lng: p.lng as number,
        label: p.name,
        status: p.status,
      })),
    [],
  );

  // Only zoom in when a project is explicitly selected (clicked), not on hover
  const center =
    selectedProjectId !== null &&
    activeProject?.hasGps &&
    typeof activeProject.lat === 'number' &&
    typeof activeProject.lng === 'number'
      ? { lat: activeProject.lat, lng: activeProject.lng }
      : undefined;

  const zoom = selectedProjectId !== null && activeProject?.hasGps ? 14 : 7;

  return (
    <div className="animate-fade-in -mx-6 lg:-mx-[5rem] -mt-20 -mb-12">
      <div className="flex h-screen">
        {/* ── Sidebar ── */}
        <div className="w-[320px] bg-[var(--bg-secondary)] border-r border-[var(--border)] overflow-y-auto pt-20 flex flex-col">
          {/* Filters */}
          <div className="px-4 py-4 border-b border-[var(--border)] space-y-3">
            <h2 className="text-h3">Projects</h2>

            {/* Address / name search */}
            <div className="flex items-center gap-2 border border-[var(--border)] px-3 py-2 bg-[var(--bg-card)] focus-within:border-[var(--accent)] transition-colors">
              <Search className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
              <input
                type="text"
                value={addressSearch}
                onChange={(e) => setAddressSearch(e.target.value)}
                placeholder="Search by name or address…"
                className="flex-1 bg-transparent text-[0.78rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
              />
              {addressSearch && (
                <button
                  type="button"
                  onClick={() => setAddressSearch('')}
                  className="text-[var(--text-muted)] hover:text-[var(--accent)]"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-transparent border border-[var(--border)] px-3 py-2 text-[0.78rem] font-body text-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="" className="bg-[var(--bg-card)]">All Statuses</option>
              <option value="active" className="bg-[var(--bg-card)]">Active</option>
              <option value="review" className="bg-[var(--bg-card)]">In Review</option>
              <option value="planning" className="bg-[var(--bg-card)]">Planning</option>
              <option value="complete" className="bg-[var(--bg-card)]">Complete</option>
            </select>
          </div>

          {/* Project list */}
          <div className="divide-y divide-[var(--border)] flex-1">
            {filteredProjects.length === 0 && (
              <p className="px-4 py-6 text-[0.75rem] text-[var(--text-muted)]">No projects match the filters.</p>
            )}
            {filteredProjects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  setSelectedProjectId((prev) => (prev === p.id ? null : p.id))
                }
                onMouseEnter={() => {
                  cancelHoverClear();
                  setHoveredProjectId(p.id);
                }}
                onMouseLeave={scheduleHoverClear}
                className={[
                  'w-full text-left px-4 py-3 transition-colors',
                  selectedProjectId === p.id
                    ? 'bg-[var(--accent-light)] border-l-2 border-l-[var(--accent)]'
                    : 'hover:bg-[var(--accent-glow)]',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-[0.82rem] font-body font-medium text-[var(--text-primary)] leading-snug">
                    {p.name}
                  </p>
                  <StatusBadge status={p.status}>
                    {p.status === 'active' ? 'Active' : p.status === 'review' ? 'In Review' : 'Planning'}
                  </StatusBadge>
                </div>
                <p className="text-currency text-[0.78rem]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {formatRands(p.contractValue)}
                </p>
                {p.fullAddress && (
                  <p className="text-[0.62rem] text-[var(--text-muted)] mt-0.5 leading-snug truncate">
                    {p.fullAddress}
                  </p>
                )}
                {!p.hasGps && (
                  <p className="text-[0.58rem] text-[var(--status-warning)] mt-0.5">No GPS · address-only</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Map area ── */}
        <div className="flex-1 bg-[var(--bg-primary)] flex items-center justify-center pt-16 relative">
          <div className="w-full h-full px-6 lg:px-0 relative">
            <AtlasMap
              markers={markers}
              center={center}
              zoom={zoom}
              height="calc(100vh - 140px)"
              onMarkerClick={(m) =>
                setSelectedProjectId((prev) => (prev === m.id ? null : m.id))
              }
            />

            {/* No selection hint */}
            {!activeProject && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 px-5 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] shadow flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[var(--accent-dim)]" />
                <p className="text-[0.75rem] text-[var(--text-muted)]">
                  Hover or click a project to view details
                </p>
              </div>
            )}

            {/* Project detail card — stays as long as hovered or selected */}
            {activeProject && (
              <div
                className="absolute z-30 top-4 left-4 w-[340px] bg-[var(--bg-surface)] border border-[var(--border-default)] p-5 shadow-lg"
                onMouseEnter={cancelHoverClear}
                onMouseLeave={scheduleHoverClear}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="text-h3 text-[1rem] mb-2 truncate">{activeProject.name}</h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <StatusBadge status={activeProject.status}>
                        {activeProject.status === 'active'
                          ? 'Active'
                          : activeProject.status === 'review'
                          ? 'In Review'
                          : 'Planning'}
                      </StatusBadge>
                      <span
                        className="text-currency text-[0.92rem]"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {formatRands(activeProject.contractValue)}
                      </span>
                    </div>
                  </div>

                  {/* Dismiss (only when project is explicitly selected) */}
                  {selectedProjectId === activeProject.id && (
                    <button
                      type="button"
                      aria-label="Deselect project"
                      onClick={() => setSelectedProjectId(null)}
                      className="shrink-0 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Address */}
                <div className="pt-3 border-t border-[var(--border)]">
                  <p className="text-[0.7rem] text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Project Address
                  </p>
                  <p className="text-[0.82rem] text-[var(--text-primary)] leading-relaxed">
                    {activeProject.fullAddress}
                  </p>
                  {activeProject.hasGps && (
                    <p
                      className="text-[0.65rem] text-[var(--text-muted)] mt-1"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {activeProject.lat?.toFixed(5)}, {activeProject.lng?.toFixed(5)}
                    </p>
                  )}
                  {!activeProject.hasGps && (
                    <p className="text-[0.65rem] text-[var(--status-warning)] mt-1">
                      GPS coordinates not recorded — address shown only
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
