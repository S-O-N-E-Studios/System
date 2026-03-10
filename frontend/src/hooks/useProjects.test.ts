import { describe, it, expect, vi } from 'vitest';

vi.mock('@/api/projects', () => ({
  projectsApi: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { useProjects, useProject, useCreateProject, useUpdateProject, useDeleteProject } from './useProjects';

describe('useProjects hooks', () => {
  it('exports all expected hooks', () => {
    expect(typeof useProjects).toBe('function');
    expect(typeof useProject).toBe('function');
    expect(typeof useCreateProject).toBe('function');
    expect(typeof useUpdateProject).toBe('function');
    expect(typeof useDeleteProject).toBe('function');
  });
});
