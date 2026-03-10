import { describe, it, expect, vi } from 'vitest';

vi.mock('@/api/tasks', () => ({
  tasksApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
  },
  sprintsApi: {
    list: vi.fn(),
    getActive: vi.fn(),
  },
}));

import { useTasks, useSprints, useActiveSprint, useCreateTask, useUpdateTaskStatus, useDeleteTask } from './useTasks';

describe('useTasks hooks', () => {
  it('exports all expected hooks', () => {
    expect(typeof useTasks).toBe('function');
    expect(typeof useSprints).toBe('function');
    expect(typeof useActiveSprint).toBe('function');
    expect(typeof useCreateTask).toBe('function');
    expect(typeof useUpdateTaskStatus).toBe('function');
    expect(typeof useDeleteTask).toBe('function');
  });
});
