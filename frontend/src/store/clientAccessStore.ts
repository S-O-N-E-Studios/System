import { create } from 'zustand';
import type { TemporaryAccess, TemporaryAccessStatus } from '@/types';

interface ClientAccessState {
  grants: TemporaryAccess[];
  selectedGrantId: string | null;
  filterStatus: TemporaryAccessStatus | null;
  isLoading: boolean;

  // CLIENT_TEMP UX helpers (derived from client-access-check).
  expiresAt: string | null;
  allowedProjectIds: string[];

  setGrants: (grants: TemporaryAccess[]) => void;
  addGrant: (grant: TemporaryAccess) => void;
  updateGrant: (id: string, updates: Partial<TemporaryAccess>) => void;
  setSelectedGrant: (id: string | null) => void;
  setFilterStatus: (status: TemporaryAccessStatus | null) => void;
  setLoading: (loading: boolean) => void;

  setExpiresAt: (expiresAt: string | null) => void;
  setAllowedProjectIds: (projectIds: string[]) => void;
  clearClientTempScope: () => void;
}

export const useClientAccessStore = create<ClientAccessState>((set) => ({
  grants: [],
  selectedGrantId: null,
  filterStatus: null,
  isLoading: false,

  expiresAt: null,
  allowedProjectIds: [],

  setGrants: (grants) => set({ grants }),

  addGrant: (grant) =>
    set((s) => ({ grants: [...s.grants, grant] })),

  updateGrant: (id, updates) =>
    set((s) => ({
      grants: s.grants.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })),

  setSelectedGrant: (id) => set({ selectedGrantId: id }),

  setFilterStatus: (status) => set({ filterStatus: status }),

  setLoading: (isLoading) => set({ isLoading }),

  setExpiresAt: (expiresAt) => set({ expiresAt }),

  setAllowedProjectIds: (projectIds) => set({ allowedProjectIds: projectIds }),

  clearClientTempScope: () => set({ expiresAt: null, allowedProjectIds: [] }),
}));
