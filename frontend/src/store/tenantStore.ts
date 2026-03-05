import { create } from 'zustand';

interface CurrentTenant {
  id: string;
  slug: string;
  name: string;
  logo?: string;
  plan: 'starter' | 'professional' | 'enterprise';
}

interface TenantState {
  currentTenant: CurrentTenant | null;

  setTenant: (tenant: CurrentTenant) => void;
  clearTenant: () => void;
  getSlug: () => string | null;
}

export const useTenantStore = create<TenantState>((set, get) => ({
  currentTenant: null,

  setTenant: (tenant) => set({ currentTenant: tenant }),

  clearTenant: () => set({ currentTenant: null }),

  getSlug: () => get().currentTenant?.slug ?? null,
}));
