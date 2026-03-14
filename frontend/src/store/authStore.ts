import { create } from 'zustand';
import type { User, AuthTokens, TenantSummary } from '@/types';

const TOKEN_KEY = 'sone_refresh_token';

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
  getStoredRefreshToken: () => string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: (user, tokens) => {
    try { localStorage.setItem(TOKEN_KEY, tokens.refreshToken); } catch { /* noop */ }
    set({
      user,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* noop */ }
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setUser: (user) => set({ user }),

  refreshTokens: (tokens) => {
    try { localStorage.setItem(TOKEN_KEY, tokens.refreshToken); } catch { /* noop */ }
    set({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  },

  setLoading: (isLoading) => set({ isLoading }),

  getUserTenants: () => get().user?.tenants ?? [],

  getStoredRefreshToken: () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
}));
