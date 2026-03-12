import { create } from 'zustand';
import type { User, AuthTokens, TenantSummary } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  setUser: (user: User) => void;
  refreshTokens: (tokens: AuthTokens) => void;
  setLoading: (loading: boolean) => void;
  getUserTenants: () => TenantSummary[];
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: (user, tokens) =>
    set({
      user,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
      isLoading: false,
    }),

  logout: () =>
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  setUser: (user) => set({ user }),

  refreshTokens: (tokens) =>
    set({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  getUserTenants: () => get().user?.tenants ?? [],
}));
