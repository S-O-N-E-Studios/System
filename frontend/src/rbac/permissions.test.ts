import { describe, expect, it } from 'vitest';
import type { UserRole } from '@/types';
import { canForRole, type Permission } from './permissions';

describe('rbac canForRole', () => {
  const role = (r: UserRole) => r;

  it('blocks CLIENT_TEMP from project editing', () => {
    expect(canForRole(role('CLIENT_TEMP'), 'edit_project')).toBe(false);
    expect(canForRole(role('CLIENT_TEMP'), 'create_project')).toBe(false);
  });

  it('allows CLIENT_TEMP to view projects', () => {
    expect(canForRole(role('CLIENT_TEMP'), 'view_projects')).toBe(true);
  });

  it('blocks VIEWER from creating/editing projects', () => {
    expect(canForRole(role('VIEWER'), 'create_project')).toBe(false);
    expect(canForRole(role('VIEWER'), 'edit_project')).toBe(false);
  });

  it('allows ORG_ADMIN to create/edit projects', () => {
    expect(canForRole(role('ORG_ADMIN'), 'create_project')).toBe(true);
    expect(canForRole(role('ORG_ADMIN'), 'edit_project')).toBe(true);
  });

  it('allows SUPER_ADMIN everything (tenant UI level)', () => {
    const permissions: Permission[] = [
      'view_settings',
      'edit_project',
      'create_project',
      'view_kanban',
    ];

    for (const p of permissions) {
      expect(canForRole(role('SUPER_ADMIN'), p)).toBe(true);
    }
  });
});

