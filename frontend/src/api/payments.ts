import apiClient from './client';
import type { PaymentHistoryEntry, PaginatedResponse } from '@/types';

interface PaymentHistoryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  projectId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const paymentsApi = {
  listPaymentHistory: async (params?: PaymentHistoryParams): Promise<PaginatedResponse<PaymentHistoryEntry>> => {
    const res = await apiClient.get<PaginatedResponse<PaymentHistoryEntry>>('/payments/history', { params });
    return res.data;
  },
};

/** Mock data for Payment History when backend is not ready */
export function mockPaymentHistory(): PaymentHistoryEntry[] {
  return [
    {
      id: '1',
      tenantId: 't1',
      projectId: 'p1',
      projectName: 'Polokwane Water Treatment Upgrade',
      consultantName: 'Geoscience Ltd',
      invoiceNumber: 'INV-2026-001',
      paymentDate: '2026-01-20',
      paymentAmount: 450000000,
      paymentStatus: 'completed',
    },
    {
      id: '2',
      tenantId: 't1',
      projectId: 'p1',
      projectName: 'Polokwane Water Treatment Upgrade',
      consultantName: 'BuildCorp SA',
      invoiceNumber: 'INV-2026-002',
      paymentDate: '2026-02-10',
      paymentAmount: 320000000,
      paymentStatus: 'completed',
    },
    {
      id: '6',
      tenantId: 't1',
      projectId: 'p1',
      projectName: 'Polokwane Water Treatment Upgrade',
      consultantName: 'Geoscience Ltd',
      invoiceNumber: 'INV-2026-006',
      paymentDate: '2026-02-25',
      paymentAmount: 175000000,
      paymentStatus: 'completed',
    },
    {
      id: '7',
      tenantId: 't1',
      projectId: 'p1',
      projectName: 'Polokwane Water Treatment Upgrade',
      consultantName: 'BuildCorp SA',
      invoiceNumber: 'INV-2026-007',
      paymentDate: '2026-03-01',
      paymentAmount: 280000000,
      paymentStatus: 'pending',
    },
    {
      id: '8',
      tenantId: 't1',
      projectId: 'p1',
      projectName: 'Polokwane Water Treatment Upgrade',
      consultantName: 'Fortune Mabona Consulting',
      invoiceNumber: 'INV-2026-008',
      paymentDate: '2026-03-05',
      paymentAmount: 95000000,
      paymentStatus: 'processing',
    },
    {
      id: '9',
      tenantId: 't1',
      projectId: 'p1',
      projectName: 'Polokwane Water Treatment Upgrade',
      consultantName: 'EnviroTest SA',
      invoiceNumber: 'INV-2026-009',
      paymentDate: '2026-03-08',
      paymentAmount: 42000000,
      paymentStatus: 'failed',
    },
    {
      id: '3',
      tenantId: 't1',
      projectId: 'p2',
      projectName: 'Mokopane Road Rehabilitation',
      consultantName: 'Terra Investigations',
      invoiceNumber: 'INV-2026-003',
      paymentDate: '2026-03-01',
      paymentAmount: 185000000,
      paymentStatus: 'pending',
    },
    {
      id: '4',
      tenantId: 't1',
      projectId: 'p2',
      projectName: 'Mokopane Road Rehabilitation',
      consultantName: 'RoadWorks Inc',
      invoiceNumber: 'INV-2026-004',
      paymentDate: '2026-01-20',
      paymentAmount: 210000000,
      paymentStatus: 'completed',
    },
    {
      id: '10',
      tenantId: 't1',
      projectId: 'p2',
      projectName: 'Mokopane Road Rehabilitation',
      consultantName: 'Terra Investigations',
      invoiceNumber: 'INV-2026-010',
      paymentDate: '2026-02-15',
      paymentAmount: 95000000,
      paymentStatus: 'completed',
    },
    {
      id: '5',
      tenantId: 't1',
      projectId: 'p3',
      projectName: 'Tzaneen Bridge Construction',
      consultantName: 'Structural Solutions',
      invoiceNumber: 'INV-2026-005',
      paymentDate: '2026-03-05',
      paymentAmount: 52000000,
      paymentStatus: 'failed',
    },
    {
      id: '11',
      tenantId: 't1',
      projectId: 'p3',
      projectName: 'Tzaneen Bridge Construction',
      consultantName: 'Structural Solutions',
      invoiceNumber: 'INV-2026-011',
      paymentDate: '2026-02-01',
      paymentAmount: 340000000,
      paymentStatus: 'completed',
    },
    {
      id: '12',
      tenantId: 't1',
      projectId: 'p3',
      projectName: 'Tzaneen Bridge Construction',
      consultantName: 'GeoFoundation Experts',
      invoiceNumber: 'INV-2026-012',
      paymentDate: '2026-02-20',
      paymentAmount: 128000000,
      paymentStatus: 'pending',
    },
  ];
}
