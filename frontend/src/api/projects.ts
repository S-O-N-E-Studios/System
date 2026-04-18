import apiClient from './client';
import { useTenantStore } from '@/store/tenantStore';
import type { Project, ApiResponse, ProjectFormData } from '@/types';

function slug() {
  return useTenantStore.getState().getSlug() || '';
}

const isNotFound = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'response' in error &&
  typeof (error as { response?: { status?: number } }).response?.status === 'number' &&
  (error as { response?: { status?: number } }).response?.status === 404;

interface ProjectListParams {
  page?: number;
  limit?: number;
  status?: string;
  serviceCategory?: string;
  localMunicipality?: string;
  stage?: number;
  contractType?: string;
  search?: string;
  deptId?: string;
}

type DeliverableRecord = {
  stage: number;
  key: string;
  deliverableName: string;
  category: string;
  group?: string | null;
  requiresClientApproval: boolean;
  status: 'not_started' | 'uploaded' | 'pending_approval' | 'approved' | 'rejected';
  fileId?: string | null;
  fileName?: string | null;
  approvalId?: string | null;
  rejectionReason?: string | null;
};

type AppointmentStepStatus = 'approved' | 'not_approved' | 'not_applicable' | 'pending';

type AppointmentRecord = {
  _id: string;
  appointmentType: string;
  assignee?: {
    name?: string | null;
    firm?: string | null;
    contactEmail?: string | null;
  };
  isComplete: boolean;
  steps: Array<{
    stepKey: string;
    status: AppointmentStepStatus;
    reason?: string | null;
  }>;
};

type InterimPaymentCertificate = {
  _id: string;
  amount: number;
  paymentDate: string;
  billingPeriod?: string | null;
  certificateNo?: string | null;
  description?: string | null;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  overrideFlag?: boolean;
  overrideReason?: string | null;
  rejectionReason?: string | null;
  checksAtApproval?: {
    progressReportPresent: boolean | null;
    evidenceCount: number | null;
    evidenceMinimum: number | null;
    withinBudget: boolean | null;
  };
  readiness?: {
    progressReportPresent: boolean;
    evidenceCount: number;
    evidenceMinimum: number;
    withinBudget: boolean;
    allChecksPassed: boolean;
  };
};

type CloseOutReportType = 'principal' | 'safety' | 'eia';

type ProjectUpsertData = Partial<ProjectFormData> & Record<string, unknown>;

export const projectsApi = {
  list: async (params?: ProjectListParams): Promise<{ projects: Project[]; total: number }> => {
    const res = await apiClient.get<ApiResponse<{ projects: Project[]; total: number }>>(`/${slug()}/projects`, { params });
    return res.data.data;
  },

  getById: async (id: string): Promise<Project> => {
    const res = await apiClient.get<ApiResponse<{ project: Project }>>(`/${slug()}/projects/${id}`);
    return res.data.data.project;
  },

  create: async (data: ProjectUpsertData): Promise<Project> => {
    const res = await apiClient.post<ApiResponse<{ project: Project }>>(`/${slug()}/projects`, data);
    return res.data.data.project;
  },

  update: async (id: string, data: ProjectUpsertData): Promise<Project> => {
    const res = await apiClient.patch<ApiResponse<{ project: Project }>>(`/${slug()}/projects/${id}`, data);
    return res.data.data.project;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/${slug()}/projects/${id}`);
  },

  getBudgetSummary: async (deptId?: string) => {
    const params = deptId ? { deptId } : {};
    const res = await apiClient.get<ApiResponse<{ summary: Record<string, number> }>>(`/${slug()}/projects/budget-summary`, { params });
    return res.data.data.summary;
  },

  getStageStatus: async (projectId: string) => {
    const res = await apiClient.get<ApiResponse<Record<string, unknown>>>(`/${slug()}/projects/${projectId}/stage-status`);
    return res.data.data;
  },

  advanceStage: async (projectId: string) => {
    const res = await apiClient.post<ApiResponse<Record<string, unknown>>>(`/${slug()}/projects/${projectId}/advance-stage`);
    return res.data.data;
  },

  listPayments: async (projectId: string) => {
    const canonicalPath = `/${slug()}/projects/${projectId}/payment-certificates`;
    const legacyPath = `/${slug()}/projects/${projectId}/payments`;
    try {
      const res = await apiClient.get<ApiResponse<{ payments: unknown[] }>>(canonicalPath);
      return res.data.data.payments;
    } catch (error) {
      if (!isNotFound(error)) throw error;
      const res = await apiClient.get<ApiResponse<{ payments: unknown[] }>>(legacyPath);
      return res.data.data.payments;
    }
  },

  addPayment: async (projectId: string, data: Record<string, unknown>) => {
    const canonicalPath = `/${slug()}/projects/${projectId}/payment-certificates`;
    const legacyPath = `/${slug()}/projects/${projectId}/payments`;
    try {
      const res = await apiClient.post<ApiResponse<{ payment: unknown }>>(canonicalPath, data);
      return res.data.data.payment;
    } catch (error) {
      if (!isNotFound(error)) throw error;
      const res = await apiClient.post<ApiResponse<{ payment: unknown }>>(legacyPath, data);
      return res.data.data.payment;
    }
  },

  getPaymentForecast: async (projectId: string) => {
    const res = await apiClient.get<ApiResponse<{ forecast: unknown[] }>>(`/${slug()}/projects/${projectId}/payment-forecast`);
    return res.data.data.forecast;
  },

  listDeliverables: async (projectId: string, params?: { stage?: number }) => {
    const res = await apiClient.get<ApiResponse<{ deliverables: DeliverableRecord[] }>>(
      `/${slug()}/projects/${projectId}/deliverables`,
      { params }
    );
    return res.data.data.deliverables;
  },

  getDeliverable: async (projectId: string, key: string, params?: { stage?: number }) => {
    const res = await apiClient.get<ApiResponse<{ deliverable: DeliverableRecord }>>(
      `/${slug()}/projects/${projectId}/deliverables/${key}`,
      { params }
    );
    return res.data.data.deliverable;
  },

  uploadDeliverable: async (projectId: string, key: string, data: { fileId: string }, params?: { stage?: number }) => {
    const res = await apiClient.post<ApiResponse<{ deliverable: DeliverableRecord }>>(
      `/${slug()}/projects/${projectId}/deliverables/${key}/upload`,
      data,
      { params }
    );
    return res.data.data.deliverable;
  },

  approveDeliverable: async (projectId: string, key: string, params?: { stage?: number }) => {
    const res = await apiClient.post<ApiResponse<{ deliverable: DeliverableRecord }>>(
      `/${slug()}/projects/${projectId}/deliverables/${key}/approve`,
      {},
      { params }
    );
    return res.data.data.deliverable;
  },

  rejectDeliverable: async (projectId: string, key: string, data: { reason: string }, params?: { stage?: number }) => {
    const res = await apiClient.post<ApiResponse<{ deliverable: DeliverableRecord }>>(
      `/${slug()}/projects/${projectId}/deliverables/${key}/reject`,
      data,
      { params }
    );
    return res.data.data.deliverable;
  },

  listAppointments: async (projectId: string) => {
    const res = await apiClient.get<ApiResponse<{ appointments: AppointmentRecord[] }>>(
      `/${slug()}/projects/${projectId}/appointments`
    );
    return res.data.data.appointments;
  },

  createAppointment: async (
    projectId: string,
    data: {
      role: string;
      firmName?: string;
      contactPerson?: string;
      contactEmail?: string;
      applicable?: boolean;
      notApplicableReason?: string;
    }
  ) => {
    const res = await apiClient.post<ApiResponse<{ appointment: AppointmentRecord }>>(
      `/${slug()}/projects/${projectId}/appointments`,
      data
    );
    return res.data.data.appointment;
  },

  updateAppointment: async (
    projectId: string,
    appointmentId: string,
    data: {
      firmName?: string;
      contactPerson?: string;
      contactEmail?: string;
      applicable?: boolean;
      notApplicableReason?: string;
    }
  ) => {
    const res = await apiClient.patch<ApiResponse<{ appointment: AppointmentRecord }>>(
      `/${slug()}/projects/${projectId}/appointments/${appointmentId}`,
      data
    );
    return res.data.data.appointment;
  },

  approveAppointmentStep: async (
    projectId: string,
    appointmentId: string,
    step: string,
    data?: { fileIds?: string[] }
  ) => {
    const res = await apiClient.post<ApiResponse<{ appointment: AppointmentRecord }>>(
      `/${slug()}/projects/${projectId}/appointments/${appointmentId}/steps/${step}/approve`,
      data || {}
    );
    return res.data.data.appointment;
  },

  rejectAppointmentStep: async (
    projectId: string,
    appointmentId: string,
    step: string,
    data: { reason: string; fileIds?: string[] }
  ) => {
    const res = await apiClient.post<ApiResponse<{ appointment: AppointmentRecord }>>(
      `/${slug()}/projects/${projectId}/appointments/${appointmentId}/steps/${step}/reject`,
      data
    );
    return res.data.data.appointment;
  },

  getAppointmentStageStatus: async (projectId: string) => {
    const res = await apiClient.get<ApiResponse<{
      roles: Array<{
        role: string;
        appointmentId: string | null;
        exists: boolean;
        complete: boolean;
        steps: Array<{ stepKey: string; status: AppointmentStepStatus; reason?: string | null }>;
      }>;
      summary: {
        totalRoles: number;
        completeRoles: number;
        incompleteRoles: number;
        gatePassed: boolean;
      };
    }>>(`/${slug()}/projects/${projectId}/appointments/stage-status`);
    return res.data.data;
  },

  listInterimPaymentCertificates: async (projectId: string) => {
    const res = await apiClient.get<ApiResponse<{ certificates: InterimPaymentCertificate[] }>>(
      `/${slug()}/projects/${projectId}/interim-payment-certificates`
    );
    return res.data.data.certificates;
  },

  getInterimPaymentCertificate: async (projectId: string, certificateId: string) => {
    const res = await apiClient.get<ApiResponse<{ certificate: InterimPaymentCertificate }>>(
      `/${slug()}/projects/${projectId}/interim-payment-certificates/${certificateId}`
    );
    return res.data.data.certificate;
  },

  createInterimPaymentCertificate: async (
    projectId: string,
    data: {
      amount: number;
      paymentDate: string;
      billingPeriod: string;
      certificateNo?: string;
      description?: string;
      certificateFileId?: string;
    }
  ) => {
    const res = await apiClient.post<ApiResponse<{ certificate: InterimPaymentCertificate }>>(
      `/${slug()}/projects/${projectId}/interim-payment-certificates`,
      data
    );
    return res.data.data.certificate;
  },

  approveInterimPaymentCertificate: async (
    projectId: string,
    certificateId: string,
    data?: { overrideReason?: string }
  ) => {
    const res = await apiClient.post<ApiResponse<{ certificate: InterimPaymentCertificate }>>(
      `/${slug()}/projects/${projectId}/interim-payment-certificates/${certificateId}/approve`,
      data || {}
    );
    return res.data.data.certificate;
  },

  rejectInterimPaymentCertificate: async (
    projectId: string,
    certificateId: string,
    data: { reason: string }
  ) => {
    const res = await apiClient.post<ApiResponse<{ certificate: InterimPaymentCertificate }>>(
      `/${slug()}/projects/${projectId}/interim-payment-certificates/${certificateId}/reject`,
      data
    );
    return res.data.data.certificate;
  },

  listBillingPeriods: async (projectId: string) => {
    const res = await apiClient.get<ApiResponse<{ billingPeriods: Array<{
      period: string;
      progressReportPresent: boolean;
      safetyReportPresent: boolean;
      cashFlowPresent: boolean;
      meetingMinutesPresent: boolean;
      evidenceImageCount: number;
      evidenceMinimum: number;
      evidenceSufficient: boolean;
      paymentCertificateCount: number;
      approvedCertificates: number;
      submittedCertificates: number;
      rejectedCertificates: number;
      latestCertificateId: string | null;
      reportingComplete: boolean;
    }> }>>(`/${slug()}/projects/${projectId}/billing-periods`);
    return res.data.data.billingPeriods;
  },

  getBillingPeriodDetail: async (projectId: string, period: string) => {
    const res = await apiClient.get<ApiResponse<{ billingPeriod: {
      period: string;
      progressReportPresent: boolean;
      safetyReportPresent: boolean;
      cashFlowPresent: boolean;
      meetingMinutesPresent: boolean;
      evidenceImageCount: number;
      evidenceMinimum: number;
      evidenceSufficient: boolean;
      paymentCertificateCount: number;
      approvedCertificates: number;
      submittedCertificates: number;
      rejectedCertificates: number;
      latestCertificateId: string | null;
      reportingComplete: boolean;
    } }>>(`/${slug()}/projects/${projectId}/billing-periods/${period}`);
    return res.data.data.billingPeriod;
  },

  listCloseOutReports: async (projectId: string) => {
    const res = await apiClient.get<ApiResponse<{ reports: Array<{
      stage: number;
      key: string;
      deliverableName: string;
      category: string;
      reportType: CloseOutReportType | null;
      status: 'not_started' | 'uploaded' | 'pending_approval' | 'approved' | 'rejected';
      fileId?: string | null;
      fileName?: string | null;
      rejectionReason?: string | null;
    }> }>>(`/${slug()}/projects/${projectId}/close-out-reports`);
    return res.data.data.reports;
  },

  createCloseOutReport: async (
    projectId: string,
    data: { reportType: CloseOutReportType; fileId: string }
  ) => {
    const res = await apiClient.post<ApiResponse<{ report: unknown }>>(
      `/${slug()}/projects/${projectId}/close-out-reports`,
      data
    );
    return res.data.data.report;
  },

  approveCloseOutReport: async (projectId: string, reportType: CloseOutReportType) => {
    const res = await apiClient.post<ApiResponse<{ report: unknown }>>(
      `/${slug()}/projects/${projectId}/close-out-reports/${reportType}/approve`,
      {}
    );
    return res.data.data.report;
  },

  rejectCloseOutReport: async (
    projectId: string,
    reportType: CloseOutReportType,
    data: { reason: string }
  ) => {
    const res = await apiClient.post<ApiResponse<{ report: unknown }>>(
      `/${slug()}/projects/${projectId}/close-out-reports/${reportType}/reject`,
      data
    );
    return res.data.data.report;
  },
};
