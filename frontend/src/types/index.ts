import { z } from 'zod';

/* ═══════════════════════════════════════════════════════════════════════════
   Core Domain Types — S.O.N.E Studios Engineering PM Platform
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── Roles ────────────────────────────────────────────────────────────────
export type UserRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'PROJECT_MANAGER' | 'MEMBER' | 'VIEWER';

// ─── Theme ────────────────────────────────────────────────────────────────
export type Theme = 'dark' | 'light';

// ─── Auth ─────────────────────────────────────────────────────────────────
export interface TenantSummary {
  id: string;
  slug: string;
  name: string;
  logo?: string;
  role: UserRole;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  tenants: TenantSummary[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── Tenant ───────────────────────────────────────────────────────────────
export interface Tenant {
  id: string;
  slug: string;
  name: string;
  logo?: string;
  plan: 'starter' | 'professional' | 'enterprise';
  primaryContact: string;
  primaryEmail: string;
  address?: string;
  timezone?: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Project ──────────────────────────────────────────────────────────────
export type ProjectStatus = 'active' | 'in_review' | 'not_started' | 'complete' | 'overdue';
export type GeoTecReportStatus = 'submitted' | 'in_review' | 'pending' | 'not_started';
export type DDRStatus = 'complete' | 'in_review' | 'pending';
export type ConstructionStatus = 'on_track' | 'at_risk' | 'delayed' | 'complete';
export type ProjectTab = 'ps' | 'geo' | 'cm';

export interface Project {
  id: string;
  tenantId: string;
  name: string;
  referenceCode: string;
  contractValue: number;
  expenditureToDate: number;
  balance: number;
  status: ProjectStatus;
  gpsLatitude?: number;
  gpsLongitude?: number;
  geoTecEngineer?: string;
  geoTecReportStatus?: GeoTecReportStatus;
  ddrStatus?: DDRStatus;
  contractor?: string;
  constructionStatus?: ConstructionStatus;
  startDate?: string;
  completionDate?: string;
  percentComplete?: number;
  challenges?: string;
  recommendation?: string;
  totalEmployees?: number;
  roePercent?: number;
  projectManagerId?: string;
  attachmentCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Task / Kanban ────────────────────────────────────────────────────────
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

export interface Task {
  id: string;
  tenantId: string;
  projectId?: string;
  sprintId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  tenantId: string;
  number: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// ─── Reports ──────────────────────────────────────────────────────────────
export type ReportType = 'project_status' | 'budget_summary' | 'claim_schedule';

export interface Report {
  id: string;
  tenantId: string;
  title: string;
  type: ReportType;
  projectId?: string;
  status: 'draft' | 'pending' | 'submitted' | 'approved';
  createdAt: string;
  updatedAt: string;
}

// ─── Files ────────────────────────────────────────────────────────────────
export type FileCategory = 'report' | 'spreadsheet' | 'image' | 'document';

export interface ProjectFile {
  id: string;
  tenantId: string;
  projectId?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: FileCategory;
  url: string;
  uploadedById: string;
  uploadedByName: string;
  createdAt: string;
}

// ─── Expenditure Drill-Down ───────────────────────────────────────────────
export interface ExpenditureEntry {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'invoiced';
}

export interface DocumentChecklistItem {
  name: string;
  status: 'submitted' | 'in_progress' | 'not_started';
}

// ─── Activity Log ─────────────────────────────────────────────────────────
export interface ActivityEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

// ─── UI State Types ───────────────────────────────────────────────────────
export interface Toast {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  duration?: number;
}

export interface TableFilter {
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Zod Schemas (Form Validation) ───────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerOrgSchema = z.object({
  orgName: z.string().min(2, 'Organisation name is required').max(100),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(30, 'Slug must be at most 30 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  industryType: z.string().min(1, 'Please select an industry'),
  primaryContactName: z.string().min(2, 'Contact name is required'),
  primaryContactEmail: z.string().email('Please enter a valid email'),
  adminFirstName: z.string().min(2, 'First name is required'),
  adminLastName: z.string().min(2, 'Last name is required'),
  adminEmail: z.string().email('Please enter a valid email'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
  adminPasswordConfirm: z.string(),
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the terms' }),
  }),
}).refine(data => data.adminPassword === data.adminPasswordConfirm, {
  message: 'Passwords do not match',
  path: ['adminPasswordConfirm'],
});

export type RegisterOrgFormData = z.infer<typeof registerOrgSchema>;

export const projectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters').max(200),
  contractValue: z.number().positive('Contract value must be positive'),
  status: z.string().min(1, 'Status is required'),
  gpsLatitude: z.number().min(-90).max(90).optional().nullable(),
  gpsLongitude: z.number().min(-180).max(180).optional().nullable(),
  geoTecEngineer: z.string().optional(),
  projectManagerId: z.string().optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
