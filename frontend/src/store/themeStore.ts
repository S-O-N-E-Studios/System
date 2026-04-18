import { create } from 'zustand';
import type { OrgTheme, Theme } from '@/types';
import { syncAppFavicon } from '@/utils/syncAppFavicon';

interface ThemeState {
  orgTheme: OrgTheme | null;
  effectiveMode: Theme;

  setOrgTheme: (theme: OrgTheme) => void;
  clearOrgTheme: () => void;
  applyOrgOverrides: () => void;
}

function injectCssOverrides(theme: OrgTheme) {
  const root = document.documentElement;
  if (theme.primaryColour) {
    root.style.setProperty('--accent', theme.primaryColour);
  }
  if (theme.fontHeading) {
    root.style.setProperty('--font-display-override', theme.fontHeading);
  }
  if (theme.fontBody) {
    root.style.setProperty('--font-body-override', theme.fontBody);
  }
  syncAppFavicon();
}

function clearCssOverrides() {
  const root = document.documentElement;
  root.style.removeProperty('--accent');
  root.style.removeProperty('--font-display-override');
  root.style.removeProperty('--font-body-override');
  syncAppFavicon();
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  orgTheme: null,
  effectiveMode: 'dark',

  setOrgTheme: (theme) => {
    set({ orgTheme: theme });
    if (theme.defaultMode) {
      set({ effectiveMode: theme.defaultMode });
    }
    get().applyOrgOverrides();
  },

  clearOrgTheme: () => {
    clearCssOverrides();
    set({ orgTheme: null });
  },

  applyOrgOverrides: () => {
    const { orgTheme } = get();
    if (orgTheme) {
      injectCssOverrides(orgTheme);
    }
  },
}));
