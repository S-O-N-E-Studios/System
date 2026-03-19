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
}

const defaultFilters: TableFilter = {
  status: undefined,
  search: undefined,
  dateFrom: undefined,
  dateTo: undefined,
};

export const useProjectStore = create<ProjectState>((set) => ({
  activeProjectId: null,
  activeTab: 'overview',
  tableFilters: { ...defaultFilters },

  setActiveProject: (id) => set({ activeProjectId: id }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setFilters: (filters) =>
    set((s) => ({
      tableFilters: { ...s.tableFilters, ...filters },
    })),

  clearFilters: () => set({ tableFilters: { ...defaultFilters } }),
}));
