import { create } from 'zustand';
import type { Grant, GrantStatus } from '@/types';

interface GrantsState {
  grants: Grant[];
  selectedGrantId: string | null;
  filterStatus: GrantStatus | null;
  isLoading: boolean;

  setGrants: (grants: Grant[]) => void;
  setSelectedGrant: (id: string | null) => void;
  setFilterStatus: (status: GrantStatus | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useGrantsStore = create<GrantsState>((set) => ({
  grants: [],
  selectedGrantId: null,
  filterStatus: null,
  isLoading: false,

  setGrants: (grants) => set({ grants }),

  setSelectedGrant: (id) => set({ selectedGrantId: id }),

  setFilterStatus: (status) => set({ filterStatus: status }),

  setLoading: (isLoading) => set({ isLoading }),
}));
