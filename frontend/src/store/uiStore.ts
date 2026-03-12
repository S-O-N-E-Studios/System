import { create } from 'zustand';
import type { Theme, Toast } from '@/types';

interface UiState {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  theme: Theme;
  activeModal: string | null;
  modalData: unknown;
  toasts: Toast[];

  toggleSidebar: () => void;
  setSidebarMobileOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  openModal: (modalId: string, data?: unknown) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  return (localStorage.getItem('sone-theme') as Theme) ?? 'dark';
};

export const useUiStore = create<UiState>((set, get) => ({
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  theme: getInitialTheme(),
  activeModal: null,
  modalData: null,
  toasts: [],

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),

  setTheme: (theme) => {
    localStorage.setItem('sone-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  openModal: (modalId, data) => set({ activeModal: modalId, modalData: data }),

  closeModal: () => set({ activeModal: null, modalData: null }),

  addToast: (toast) => {
    const id = crypto.randomUUID();
    const newToast: Toast = { ...toast, id };
    set((s) => ({
      toasts: [...s.toasts.slice(-2), newToast],
    }));
    const duration = toast.duration ?? 4000;
    setTimeout(() => get().removeToast(id), duration);
  },

  removeToast: (id) =>
    set((s) => ({
      toasts: s.toasts.filter((t) => t.id !== id),
    })),
}));
