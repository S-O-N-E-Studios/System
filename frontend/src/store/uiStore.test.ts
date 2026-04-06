import { describe, expect, it, beforeEach, vi } from 'vitest';
import { useUiStore } from './uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUiStore.setState({
      sidebarCollapsed: false,
      sidebarMobileOpen: false,
      theme: 'dark',
      activeModal: null,
      modalData: null,
      toasts: [],
    });
  });

  describe('sidebar', () => {
    it('toggleSidebar flips collapsed state', () => {
      expect(useUiStore.getState().sidebarCollapsed).toBe(false);
      useUiStore.getState().toggleSidebar();
      expect(useUiStore.getState().sidebarCollapsed).toBe(true);
      useUiStore.getState().toggleSidebar();
      expect(useUiStore.getState().sidebarCollapsed).toBe(false);
    });

    it('setSidebarMobileOpen sets mobile open state', () => {
      useUiStore.getState().setSidebarMobileOpen(true);
      expect(useUiStore.getState().sidebarMobileOpen).toBe(true);
      useUiStore.getState().setSidebarMobileOpen(false);
      expect(useUiStore.getState().sidebarMobileOpen).toBe(false);
    });
  });

  describe('theme', () => {
    it('setTheme updates theme and persists to localStorage', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const setAttrSpy = vi.spyOn(document.documentElement, 'setAttribute');

      useUiStore.getState().setTheme('light');

      expect(useUiStore.getState().theme).toBe('light');
      expect(setItemSpy).toHaveBeenCalledWith('p360-theme', 'light');
      expect(setAttrSpy).toHaveBeenCalledWith('data-theme', 'light');

      setItemSpy.mockRestore();
      setAttrSpy.mockRestore();
    });

    it('toggleTheme switches between dark and light', () => {
      expect(useUiStore.getState().theme).toBe('dark');
      useUiStore.getState().toggleTheme();
      expect(useUiStore.getState().theme).toBe('light');
      useUiStore.getState().toggleTheme();
      expect(useUiStore.getState().theme).toBe('dark');
    });
  });

  describe('modal', () => {
    it('openModal sets activeModal and optional data', () => {
      useUiStore.getState().openModal('confirm-delete', { id: '123' });
      const state = useUiStore.getState();
      expect(state.activeModal).toBe('confirm-delete');
      expect(state.modalData).toEqual({ id: '123' });
    });

    it('openModal without data sets data to undefined', () => {
      useUiStore.getState().openModal('settings');
      expect(useUiStore.getState().activeModal).toBe('settings');
      expect(useUiStore.getState().modalData).toBeUndefined();
    });

    it('closeModal clears activeModal and modalData', () => {
      useUiStore.getState().openModal('settings', { key: 'val' });
      useUiStore.getState().closeModal();
      const state = useUiStore.getState();
      expect(state.activeModal).toBeNull();
      expect(state.modalData).toBeNull();
    });
  });

  describe('toasts', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('addToast adds a toast with generated id', () => {
      useUiStore.getState().addToast({ type: 'success', message: 'Saved!' });
      const toasts = useUiStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].message).toBe('Saved!');
      expect(toasts[0].id).toBeTruthy();
      vi.useRealTimers();
    });

    it('addToast auto-removes after default duration (4000ms)', () => {
      useUiStore.getState().addToast({ type: 'info', message: 'Info' });
      expect(useUiStore.getState().toasts).toHaveLength(1);

      vi.advanceTimersByTime(4001);
      expect(useUiStore.getState().toasts).toHaveLength(0);
      vi.useRealTimers();
    });

    it('addToast respects custom duration', () => {
      useUiStore.getState().addToast({ type: 'error', message: 'Error', duration: 2000 });
      expect(useUiStore.getState().toasts).toHaveLength(1);

      vi.advanceTimersByTime(1999);
      expect(useUiStore.getState().toasts).toHaveLength(1);

      vi.advanceTimersByTime(2);
      expect(useUiStore.getState().toasts).toHaveLength(0);
      vi.useRealTimers();
    });

    it('removeToast removes a specific toast by id', () => {
      useUiStore.getState().addToast({ type: 'success', message: 'First' });
      useUiStore.getState().addToast({ type: 'warning', message: 'Second' });

      const toasts = useUiStore.getState().toasts;
      expect(toasts).toHaveLength(2);

      useUiStore.getState().removeToast(toasts[0].id);
      expect(useUiStore.getState().toasts).toHaveLength(1);
      expect(useUiStore.getState().toasts[0].message).toBe('Second');
      vi.useRealTimers();
    });

    it('caps toasts to most recent 3 (keeps last 2 + new)', () => {
      useUiStore.getState().addToast({ type: 'info', message: '1' });
      useUiStore.getState().addToast({ type: 'info', message: '2' });
      useUiStore.getState().addToast({ type: 'info', message: '3' });
      useUiStore.getState().addToast({ type: 'info', message: '4' });

      const messages = useUiStore.getState().toasts.map((t) => t.message);
      expect(messages).toContain('4');
      expect(useUiStore.getState().toasts.length).toBeLessThanOrEqual(4);
      vi.useRealTimers();
    });
  });
});
