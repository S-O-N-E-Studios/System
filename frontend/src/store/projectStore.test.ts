import { describe, expect, it, beforeEach } from 'vitest';
import { useProjectStore } from './projectStore';

describe('projectStore', () => {
  beforeEach(() => {
    useProjectStore.setState({
      activeProjectId: null,
      activeTab: 'overview',
      tableFilters: {
        status: undefined,
        search: undefined,
        dateFrom: undefined,
        dateTo: undefined,
      },
    });
  });

  it('has correct initial state', () => {
    const state = useProjectStore.getState();
    expect(state.activeProjectId).toBeNull();
    expect(state.activeTab).toBe('overview');
    expect(state.tableFilters.status).toBeUndefined();
    expect(state.tableFilters.search).toBeUndefined();
  });

  it('setActiveProject updates active project id', () => {
    useProjectStore.getState().setActiveProject('proj-1');
    expect(useProjectStore.getState().activeProjectId).toBe('proj-1');
  });

  it('setActiveProject can clear to null', () => {
    useProjectStore.getState().setActiveProject('proj-1');
    useProjectStore.getState().setActiveProject(null);
    expect(useProjectStore.getState().activeProjectId).toBeNull();
  });

  it('setActiveTab changes tab', () => {
    useProjectStore.getState().setActiveTab('professional');
    expect(useProjectStore.getState().activeTab).toBe('professional');

    useProjectStore.getState().setActiveTab('construction');
    expect(useProjectStore.getState().activeTab).toBe('construction');
  });

  it('setFilters merges partial filters', () => {
    useProjectStore.getState().setFilters({ status: 'active' });
    expect(useProjectStore.getState().tableFilters.status).toBe('active');
    expect(useProjectStore.getState().tableFilters.search).toBeUndefined();

    useProjectStore.getState().setFilters({ search: 'water' });
    expect(useProjectStore.getState().tableFilters.status).toBe('active');
    expect(useProjectStore.getState().tableFilters.search).toBe('water');
  });

  it('setFilters can set date range', () => {
    useProjectStore.getState().setFilters({
      dateFrom: '2026-01-01',
      dateTo: '2026-06-30',
    });
    const filters = useProjectStore.getState().tableFilters;
    expect(filters.dateFrom).toBe('2026-01-01');
    expect(filters.dateTo).toBe('2026-06-30');
  });

  it('clearFilters resets all filters to defaults', () => {
    useProjectStore.getState().setFilters({
      status: 'active',
      search: 'test',
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
    });
    useProjectStore.getState().clearFilters();
    const filters = useProjectStore.getState().tableFilters;

    expect(filters.status).toBeUndefined();
    expect(filters.search).toBeUndefined();
    expect(filters.dateFrom).toBeUndefined();
    expect(filters.dateTo).toBeUndefined();
  });
});
