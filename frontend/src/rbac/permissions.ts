import type { User, UserRole } from '@/types';

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
  | 'view_settings'
  | 'view_planning'
  | 'create_variation_order'
  | 'approve_documents'
  | 'upload_media';

const allPermanent: UserRole[] = ['ORG_ADMIN', 'DEPT_ADMIN', 'PROJECT_MANAGER', 'PM', 'MEMBER', 'VIEWER', 'SUPER_ADMIN'];
const writers: UserRole[] = ['ORG_ADMIN', 'DEPT_ADMIN', 'PROJECT_MANAGER', 'PM', 'SUPER_ADMIN'];
const approvers: UserRole[] = ['CLIENT_APPROVER', 'ORG_ADMIN', 'DEPT_ADMIN', 'SUPER_ADMIN'];

const permissionAllowList: Record<Permission, UserRole[]> = {
  view_dashboard: allPermanent,
  view_projects: [...allPermanent, 'CLIENT_TEMP', 'CLIENT_APPROVER'],
  create_project: writers,
  edit_project: [...writers, 'MEMBER'],
  view_idp: allPermanent,
  view_services: allPermanent,
  view_kanban: ['ORG_ADMIN', 'PROJECT_MANAGER', 'PM', 'SUPER_ADMIN'],
  view_calendar: allPermanent,
  view_grants: allPermanent,
  view_reports: allPermanent,
  view_maps: allPermanent,
  view_files: [...allPermanent, 'CLIENT_APPROVER'],
  view_settings: ['ORG_ADMIN', 'SUPER_ADMIN'],
  view_planning: allPermanent,
  create_variation_order: writers,
  approve_documents: approvers,
  upload_media: [...writers, 'MEMBER'],
};

export function canForRole(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  if (role === 'SUPER_ADMIN') return true;
  return permissionAllowList[permission].includes(role);
}

export function getTenantRole(user: User | null | undefined, tenantSlug: string | undefined): UserRole | undefined {
  if (!user) return undefined;
  if (!tenantSlug) return user.role;
  return user.tenants.find((tenant) => tenant.slug === tenantSlug)?.role ?? user.role;
}

export function hasDocumentApprovalAccess(user: User | null | undefined, tenantSlug: string | undefined): boolean {
  if (!user) return false;
  if (user.canApproveDocuments) return true;
  return canForRole(getTenantRole(user, tenantSlug), 'approve_documents');
}
