import type { UserRole } from '@/types';

export type Permission =
  | 'view_dashboard'
  | 'view_projects'
  | 'create_project'
  | 'edit_project'
  | 'view_idp'
  | 'view_services'
  | 'view_kanban'
  | 'view_calendar'
  | 'view_grants'
  | 'view_reports'
  | 'view_maps'
  | 'view_files'
  | 'view_settings';

const permissionAllowList: Record<Permission, UserRole[]> = {
  view_dashboard: ['ORG_ADMIN', 'DEPT_ADMIN', 'PROJECT_MANAGER', 'MEMBER', 'VIEWER', 'SUPER_ADMIN'],
  view_projects: ['ORG_ADMIN', 'DEPT_ADMIN', 'PROJECT_MANAGER', 'MEMBER', 'VIEWER', 'CLIENT_TEMP', 'SUPER_ADMIN'],
  create_project: ['ORG_ADMIN', 'DEPT_ADMIN', 'PROJECT_MANAGER', 'MEMBER', 'SUPER_ADMIN'],
  edit_project: ['ORG_ADMIN', 'DEPT_ADMIN', 'PROJECT_MANAGER', 'MEMBER', 'SUPER_ADMIN'],
  view_idp: ['ORG_ADMIN', 'DEPT_ADMIN', 'PROJECT_MANAGER', 'MEMBER', 'VIEWER', 'SUPER_ADMIN'],
  view_services: ['ORG_ADMIN', 'DEPT_ADMIN', 'PROJECT_MANAGER', 'MEMBER', 'VIEWER', 'SUPER_ADMIN'],
  view_kanban: ['ORG_ADMIN', 'PROJECT_MANAGER', 'SUPER_ADMIN'],
  view_calendar: ['ORG_ADMIN', 'DEPT_ADMIN', 'PROJECT_MANAGER', 'MEMBER', 'VIEWER', 'SUPER_ADMIN'],
  view_grants: ['ORG_ADMIN', 'DEPT_ADMIN', 'PROJECT_MANAGER', 'MEMBER', 'VIEWER', 'SUPER_ADMIN'],
  view_reports: ['ORG_ADMIN', 'DEPT_ADMIN', 'PROJECT_MANAGER', 'MEMBER', 'VIEWER', 'SUPER_ADMIN'],
  view_maps: ['ORG_ADMIN', 'DEPT_ADMIN', 'PROJECT_MANAGER', 'MEMBER', 'VIEWER', 'SUPER_ADMIN'],
  view_files: ['ORG_ADMIN', 'DEPT_ADMIN', 'PROJECT_MANAGER', 'MEMBER', 'VIEWER', 'SUPER_ADMIN'],
  view_settings: ['ORG_ADMIN', 'SUPER_ADMIN'],
};

/**
 * Pure RBAC check used by `useCan` and for unit tests.
 */
export function canForRole(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  if (role === 'SUPER_ADMIN') return true;
  return permissionAllowList[permission].includes(role);
}

