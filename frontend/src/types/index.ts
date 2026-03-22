import { z } from 'zod';

/* ═══════════════════════════════════════════════════════════════════════════
   Core Domain Types - Project 360 Engineering PM Platform v6.0
   Atlas White Design System · Multi-Tenant SaaS
   ═══════════════════════════════════════════════════════════════════════════ */

// v6.0 Project Lifecycle and Service Categories
export type ProjectStage = 1 | 2 | 3 | 4 | 5 | 6;

export type ServiceCategory =
  | 'water_sanitation'
  | 'energy_electricity'
  | 'roads_stormwater'
  | 'waste_management'
  | 'recreational_sport_libraries'
  | 'public_transportation';

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  water_sanitation: 'Water and Sanitation',
  energy_electricity: 'Energy and Electricity',
  roads_stormwater: 'Roads and Stormwater',
  waste_management: 'Waste Management',
  recreational_sport_libraries: 'Recreational, Sport and Libraries',
  public_transportation: 'Public Transportation',
};

export const STAGE_NAMES: Record<ProjectStage, string> = {
  1: 'Inception',
  2: 'Concept and Viability',
  3: 'Design Development',
  4: 'Documentation and Procurement',
  5: 'Contract Administration and Inspection',
  6: 'Close-Out',
};

// Roles
export type UserRole =
  | 'SUPER_ADMIN'
  | 'ORG_ADMIN'
  | 'DEPT_ADMIN'
  | 'PROJECT_MANAGER'
  | 'MEMBER'
  | 'VIEWER'
  | 'CLIENT_TEMP';

// Theme
export type Theme = 'dark' | 'light';

// Tenant Types
export type OrgType = 'provincial_gov' | 'private_firm';
export type TenantStatus = 'active' | 'suspended' | 'trial';
export type PlanTier = 'starter' | 'professional' | 'enterprise';

// Auth
export interface TenantSummary {
  id: string;
  slug: string;
  name: string;
  logo?: string;
  role: UserRole;
  deptId?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  role: UserRole;
  avatarUrl?: string;
  tenants: TenantSummary[];
  temporaryAccessId?: string;
  lastLoginAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Org Theme (per-tenant overrides)
export interface OrgTheme {
  primaryColour?: string;
  fontHeading?: string;
  fontBody?: string;
  defaultMode?: Theme;
  logoUrl?: string;
  orgName?: string;
}

// Tenant
export interface Tenant {
  id: string;
  slug: string;
  name: string;
  orgType: OrgType;
  plan: PlanTier;
  primaryContact: string;
  primaryEmail?: string;
  emailDomain?: string;
  logo?: string;
  logoUrl?: string;
  status: TenantStatus;
  theme?: OrgTheme;
  address?: string;
  timezone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Department (Provincial tenants only)
export interface DepartmentProgram {
  name: string;
  budget: number;
}

export interface Department {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  budgetTotal: number;
  budgetSpent: number;
  headOfDept?: string;
  programs: DepartmentProgram[];
  createdAt: string;
  updatedAt?: string;
}

// Project
export type ProjectStatus = 'active' | 'on-hold' | 'complete' | 'cancelled';
export type ContractType = 'professional' | 'geotechnical' | 'construction';
export type ProjectTab =
  | 'overview'
  | 'professional'
  | 'geotechnical'
  | 'construction'
  | 'activities'
  | 'files'
  | 'funding';

export type GeoTecReportStatus = 'submitted' | 'in_review' | 'pending' | 'not_started';
export type DDRStatus = 'complete' | 'in_review' | 'pending';
export type ConstructionStatus = 'on_track' | 'at_risk' | 'delayed' | 'complete';

export interface CompletionGate {
  proofOfPaymentFileId?: string;
  proofOfPaymentSubmittedAt?: string;
  lastCheckedAt?: string;
  gatePassed: boolean;
}

export interface ProjectLocation {
  address?: string;
  lat?: number;
  lng?: number;
}

export interface Project {
  id: string;
  tenantId: string;
  deptId?: string;
  name: string;
  refCode: string;
  status: ProjectStatus;
  currentStage?: ProjectStage;
  serviceCategory?: ServiceCategory;
  localMunicipality?: string;
  idpProjectNo?: string;
  contractValue: number;
  expenditureToDate: number;
  balance: number;
  location?: ProjectLocation;
  gpsFormatted?: string;
  contractTypes: ContractType[];
  projectManager?: string;
  projectManagerId?: string;
  teamMembers?: string[];
  appointmentDate?: string;
  completionDate?: string;
  completionGate?: CompletionGate;
  geoTecEngineer?: string;
  geoTecReportStatus?: GeoTecReportStatus;
  ddrStatus?: DDRStatus;
  contractor?: string;
  constructionStatus?: ConstructionStatus;
  startDate?: string;
  percentComplete?: number;
  challenges?: string;
  recommendation?: string;
  totalEmployees?: number;
  roePercent?: number;
  attachmentCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// Activity (Gantt Schedule)
export type ActivityStatus = 'on-track' | 'delayed' | 'pending' | 'complete';

export interface SupportingImage {
  fileId: string;
  uploadedBy: string;
  uploadedAt: string;
  caption?: string;
}

export interface Activity {
  id: string;
  tenantId: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: ActivityStatus;
  expectedFunds?: number;
  actualFunds?: number;
  supportingImages: SupportingImage[];
  createdAt: string;
  updatedAt: string;
}

/** @deprecated Use Activity instead */
export type ScheduleActivityStatus = 'on_track' | 'at_risk' | 'delayed';
/** @deprecated Use Activity instead */
export interface ScheduleActivity {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: ScheduleActivityStatus;
}

// Task and Kanban
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

// Files
/** File Manager tab/document type (legacy UI) */
export type DocumentType =
  | 'payment_certificate'
  | 'tender_document'
  | 'drawings'
  | 'digital_survey'
  | 'geo_technical_report'
  | 'environmental_report';

export type FileCategory =
  | 'payment-certificate'
  | 'tender'
  | 'drawing'
  | 'digital-survey'
  | 'geotechnical'
  | 'environmental'
  | 'proof-of-payment'
  | 'activity-image'
  | 'other';

export interface ProjectFile {
  id: string;
  tenantId: string;
  projectId?: string;
  originalName: string;
  filename?: string;
  storagePath?: string;
  mimeType: string;
  size: number;
  sizeBytes?: number;
  category: FileCategory;
  uploadedBy: string;
  uploadedByName?: string;
  url?: string;
  taskId?: string;
  activityId?: string;
  clientVisible: boolean;
  createdAt: string;
}

// Funding Sources
export type FundingSourceType =
  | 'self_generated'
  | 'mig'
  | 'rbig'
  | 'wsig'
  | 'equitable_share'
  | 'private_client'
  | 'other';

export const FUNDER_TYPE_LABELS: Record<FundingSourceType, string> = {
  self_generated: 'Self Generated',
  mig: 'MIG',
  rbig: 'RBIG',
  wsig: 'WSIG',
  equitable_share: 'Equitable Share',
  private_client: 'Private Client',
  other: 'Other',
};

export type DisbursementStatus = 'pending' | 'received' | 'overdue';
export type ComplianceStatus = 'compliant' | 'at_risk' | 'non_compliant';

export interface DisbursementEntry {
  date: string;
  amount: number;
  status: DisbursementStatus;
}

export interface FundingSource {
  id: string;
  tenantId: string;
  projectId: string;
  sourceName: string;
  sourceType: FundingSourceType;
  funderOrg?: string;
  totalAllocated: number;
  totalDisbursed: number;
  disbursementSchedule: DisbursementEntry[];
  conditions?: string;
  complianceStatus: ComplianceStatus;
  createdAt: string;
  updatedAt: string;
}

// Grants
export type GrantStatus = 'active' | 'closed' | 'pending';

export interface ReportingScheduleEntry {
  dueDate: string;
  submittedDate?: string;
  status: 'pending' | 'submitted' | 'overdue';
}

export interface Grant {
  id: string;
  tenantId: string;
  deptId?: string;
  grantName: string;
  grantType: string;
  funderOrg: string;
  financialYear: string;
  totalValue: number;
  allocatedToProjects: number;
  disbursedToDate: number;
  remaining: number;
  complianceDeadline?: string;
  reportingSchedule: ReportingScheduleEntry[];
  linkedProjects: string[];
  status: GrantStatus;
  createdAt: string;
  updatedAt: string;
}

// Calendar Events
export type CalendarEventType =
  | 'milestone'
  | 'payment'
  | 'site_visit'
  | 'report_due'
  | 'meeting'
  | 'deadline'
  | 'activity_update'
  | 'project_complete';

export interface CalendarEvent {
  id: string;
  tenantId: string;
  projectId?: string;
  deptId?: string;
  title: string;
  eventType: CalendarEventType;
  date: string;
  endDate?: string;
  allDay: boolean;
  linkedEntity?: {
    type: 'project' | 'task' | 'activity' | 'grant';
    id: string;
  };
  notes?: string;
  createdBy?: string;
  autoGenerated: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Client Temporary Access
export type TemporaryAccessStatus = 'pending' | 'active' | 'expired' | 'revoked';

export interface AccessExtension {
  previousExpiry: string;
  newExpiry: string;
  extendedBy: string;
  extendedAt: string;
}

export interface TemporaryAccess {
  id: string;
  tenantId: string;
  grantedBy: string;
  clientEmail: string;
  clientUserId?: string;
  projectIds: string[];
  expiresAt: string;
  grantedAt: string;
  activatedAt?: string;
  status: TemporaryAccessStatus;
  revokedBy?: string;
  revokedAt?: string;
  extensionHistory: AccessExtension[];
  notes?: string;
}

// Reports
export type ReportType =
  | 'project_status'
  | 'budget_summary'
  | 'claim_schedule'
  | 'payment_forecast'
  | 'sprint_burndown'
  | 'grants_summary';

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

// Expenditure Drill Down
export interface ExpenditureEntry {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'invoiced';
}

// Payment History
export type PaymentStatus = 'completed' | 'pending' | 'failed' | 'processing';

export interface PaymentHistoryEntry {
  id: string;
  tenantId: string;
  projectId?: string;
  projectName?: string;
  consultantName: string;
  invoiceNumber: string;
  paymentDate: string;
  paymentAmount: number;
  paymentStatus: PaymentStatus;
  createdAt?: string;
}

// Completion Gate Response
export interface CompletionGateStatus {
  gatePassed: boolean;
  missing: ('proof_of_payment' | 'activity_images')[];
  activities?: { id: string; name: string }[];
}

export interface CompletionGateError {
  success: false;
  error: 'COMPLETION_GATE_FAILED';
  missing: ('proof_of_payment' | 'activity_images')[];
  activities?: { id: string; name: string }[];
}

// Document Checklist
export interface DocumentChecklistItem {
  name: string;
  status: 'submitted' | 'in_progress' | 'not_started';
}

// Activity Log
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

// UI State Types
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
  deptId?: string;
  type?: string;
  serviceCategory?: ServiceCategory;
  localMunicipality?: string;
  funder?: FundingSourceType;
  stage?: ProjectStage;
}

// Stage Gate (v6.0)
export interface StageDocumentRequirement {
  documentName: string;
  category: string;
  uploaded: boolean;
  fileId?: string;
  fileName?: string;
}

export interface StageGateStatus {
  currentStage: ProjectStage;
  gatePassed: boolean;
  missing: StageDocumentRequirement[];
}

// IDP View
export interface IDPProjectRow {
  id: string;
  idpProjectNo?: string;
  name: string;
  description?: string;
  location?: string;
  localMunicipality?: string;
  mtefYear1?: number;
  mtefYear2?: number;
  mtefYear3?: number;
  funder?: string;
  funderType?: FundingSourceType;
  serviceCategory?: ServiceCategory;
  currentStage?: ProjectStage;
  status: ProjectStatus;
}

// Normal Services View
export interface ServiceCategorySummary {
  category: ServiceCategory;
  projectCount: number;
  totalBudget: number;
  totalExpenditure: number;
  projects: Project[];
}

// API Response Wrappers
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

// Zod Schemas (Form Validation)
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
  orgType: z.enum(['provincial_gov', 'private_firm'], {
    required_error: 'Please select an organisation type',
  }),
  industryType: z.string().min(1, 'Please select an industry'),
  primaryContactName: z.string().min(2, 'Contact name is required'),
  primaryContactEmail: z.string().email('Please enter a valid email'),
  adminFirstName: z.string().min(2, 'First name is required'),
  adminLastName: z.string().min(2, 'Last name is required'),
  adminEmail: z.string().email('Please enter a valid email'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
  adminPasswordConfirm: z.string(),
  agreeToTerms: z.boolean().refine((v) => v === true, {
    message: 'You must agree to the terms',
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
  contractTypes: z.array(z.enum(['professional', 'geotechnical', 'construction'])).min(1, 'Select at least one contract type'),
  serviceCategory: z.enum([
    'water_sanitation', 'energy_electricity', 'roads_stormwater',
    'waste_management', 'recreational_sport_libraries', 'public_transportation',
  ]).optional(),
  localMunicipality: z.string().optional(),
  idpProjectNo: z.string().optional(),
  location: z.object({
    address: z.string().optional(),
    lat: z.number().min(-90).max(90).optional().nullable(),
    lng: z.number().min(-180).max(180).optional().nullable(),
  }).optional(),
  geoTecEngineer: z.string().optional(),
  contractor: z.string().optional(),
  projectManagerId: z.string().optional(),
  deptId: z.string().optional(),
  appointmentDate: z.string().optional(),
  completionDate: z.string().optional(),
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

export const grantClientAccessSchema = z.object({
  clientEmail: z.string().email('Please enter a valid email'),
  projectIds: z.array(z.string()).min(1, 'Select at least one project'),
  expiresInDays: z.number().min(1, 'Minimum 1 day').max(90, 'Maximum 90 days'),
  notes: z.string().optional(),
});

export type GrantClientAccessFormData = z.infer<typeof grantClientAccessSchema>;

export const extendAccessSchema = z.object({
  additionalDays: z.number().min(1, 'Minimum 1 day').max(90, 'Maximum 90 days'),
});

export type ExtendAccessFormData = z.infer<typeof extendAccessSchema>;

export const clientActivateSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ClientActivateFormData = z.infer<typeof clientActivateSchema>;

export const activitySchema = z.object({
  name: z.string().min(2, 'Activity name is required').max(200),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.enum(['on-track', 'delayed', 'pending', 'complete']),
  expectedFunds: z.number().nonnegative().optional(),
  actualFunds: z.number().nonnegative().optional(),
});

export type ActivityFormData = z.infer<typeof activitySchema>;

export const fundingSourceSchema = z.object({
  sourceName: z.string().min(2, 'Source name is required'),
  sourceType: z.enum(['self_generated', 'mig', 'rbig', 'wsig', 'equitable_share', 'private_client', 'other']),
  funderOrg: z.string().optional(),
  totalAllocated: z.number().positive('Total allocated must be positive'),
  conditions: z.string().optional(),
});

export type FundingSourceFormData = z.infer<typeof fundingSourceSchema>;
