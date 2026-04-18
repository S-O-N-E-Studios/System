import { create } from 'zustand';
import type { ProjectTab, TableFilter } from '@/types';

interface ProjectState {
  activeProjectId: string | null;
  activeTab: ProjectTab;
  tableFilters: TableFilter;

  setActiveProject: (id: string | null) => void;
  setActiveTab: (tab: ProjectTab) => void;
  setFilters: (filters: Partial<TableFilter>) => void;
  clearFilters: () => void;

  pinnedProjectsByTenant: Record<string, PinnedProject[]>;
  getPinnedProjects: (tenantSlug: string) => PinnedProject[];
  isProjectPinned: (tenantSlug: string, projectId: string) => boolean;
  togglePinnedProject: (tenantSlug: string, project: PinnedProject) => void;
}

const defaultFilters: TableFilter = {
  status: undefined,
  search: undefined,
  dateFrom: undefined,
  dateTo: undefined,
};

/** Stable reference for Zustand selectors when a tenant has no pins (avoid `[]` per snapshot). */
export const EMPTY_PINNED_LIST: PinnedProject[] = [];

export const useProjectStore = create<ProjectState>((set, get) => ({
  activeProjectId: null,
  activeTab: 'overview',
  tableFilters: { ...defaultFilters },

  pinnedProjectsByTenant: (() => {
    const empty: Record<string, PinnedProject[]> = {};
    if (typeof window === 'undefined') return empty;
    try {
      const raw = window.localStorage.getItem('p360-pinned-projects-v1');
      if (!raw) return empty;
      const parsed = JSON.parse(raw) as Record<string, PinnedProject[]>;
      // Defensive: ensure arrays exist.
      if (!parsed || typeof parsed !== 'object') return empty;
      for (const [k, v] of Object.entries(parsed)) {
        if (!Array.isArray(v)) parsed[k] = [];
      }
      return parsed;
    } catch {
      return empty;
    }
  })(),

  setActiveProject: (id) => set({ activeProjectId: id }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setFilters: (filters) =>
    set((s) => ({
      tableFilters: { ...s.tableFilters, ...filters },
    })),

  clearFilters: () => set({ tableFilters: { ...defaultFilters } }),

  getPinnedProjects: (tenantSlug) => {
    const pinned = get().pinnedProjectsByTenant[tenantSlug];
    return pinned ?? EMPTY_PINNED_LIST;
  },

  isProjectPinned: (tenantSlug, projectId) => {
    const pinned = get().pinnedProjectsByTenant[tenantSlug];
    return Boolean(pinned?.some((p: PinnedProject) => p.id === projectId));
  },

  togglePinnedProject: (tenantSlug, project) => {
    set((s) => {
      const current = s.pinnedProjectsByTenant[tenantSlug] ?? [];
      const exists = current.some((p: PinnedProject) => p.id === project.id);
      const next = exists
        ? current.filter((p: PinnedProject) => p.id !== project.id)
        : [{ ...project }, ...current];

      const nextByTenant = {
        ...s.pinnedProjectsByTenant,
        [tenantSlug]: next,
      };

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('p360-pinned-projects-v1', JSON.stringify(nextByTenant));
        } catch {
          // Ignore persistence failures for MVP.
        }
      }

      return { pinnedProjectsByTenant: nextByTenant };
    });
  },
}));

export type PinnedProject = {
  id: string;
  name: string;
  ref?: string;
};
