/* Stage document requirements aligned to v8.0 workflow. */

import type { ProjectStage } from '@/types';

export interface StageDocumentSpec {
  documentName: string;
  category: string;
  group?: string;
  recurring?: boolean; // Stage 5: Monthly reports can be uploaded multiple times
}

export const STAGE_DOCUMENT_REQUIREMENTS: Record<ProjectStage, StageDocumentSpec[]> = {
  0: [],
  1: [
    { documentName: 'Signed Scoping Report', category: 'scoping-report', group: 'Inception' },
    { documentName: 'Specialist Quotations', category: 'quotation', group: 'Inception' },
    { documentName: 'Quotation Approvals', category: 'quotation', group: 'Inception' },
    { documentName: 'Appointment Letters', category: 'appointment-letter', group: 'Inception' },
  ],
  2: [
    { documentName: 'Preliminary Design Report', category: 'preliminary-design-report', group: 'Planning' },
    { documentName: 'Preliminary Drawings', category: 'preliminary-design', group: 'Planning' },
    { documentName: 'Preliminary Cost Estimates', category: 'preliminary-cost-estimate', group: 'Planning' },
    { documentName: 'Digital Survey', category: 'digital-survey', group: 'Specialist Inputs' },
    { documentName: 'Geo-Technical Report', category: 'geotechnical', group: 'Specialist Inputs' },
    { documentName: 'Environmental Report', category: 'environmental', group: 'Specialist Inputs' },
    { documentName: 'Community Minutes', category: 'community-minutes', group: 'Specialist Inputs' },
  ],
  3: [
    { documentName: 'Detailed Design Report', category: 'detailed-design-report', group: 'Execution' },
    { documentName: 'Detailed Drawings', category: 'detailed-design', group: 'Execution' },
    { documentName: 'Detailed Cost Estimates', category: 'detailed-cost-estimate', group: 'Execution' },
  ],
  4: [
    { documentName: 'Tender Drawings', category: 'tender-drawing', group: 'Tender' },
    { documentName: 'Tender Document', category: 'tender-document', group: 'Tender' },
    { documentName: 'Tender Evaluation Report', category: 'tender-evaluation', group: 'Tender' },
    { documentName: 'Contractor Appointment Letter', category: 'appointment-letter', group: 'Tender' },
  ],
  5: [],
  6: [{ documentName: 'Signed Contractor Appointment Letter', category: 'appointment-letter', group: 'Appointment' }],
  7: [
    { documentName: 'Monthly Progress Reports', category: 'progress-report', group: 'Construction', recurring: true },
    { documentName: 'Monthly Safety Reports', category: 'safety-report', group: 'Construction', recurring: true },
    { documentName: 'Monthly Cash Flows', category: 'monthly-cash-flow', group: 'Construction', recurring: true },
    { documentName: 'Payment Certificates', category: 'payment-certificate', group: 'Construction', recurring: true },
    { documentName: 'Meeting Minutes', category: 'meeting-minutes', group: 'Construction', recurring: true },
  ],
  8: [
    { documentName: 'Practical Completion Certificate', category: 'practical-completion', group: 'Close-Out' },
    { documentName: 'Defects List', category: 'defects-list', group: 'Close-Out' },
  ],
  9: [
    { documentName: 'As-built Drawings', category: 'as-built-drawing', group: 'Finalisation' },
    { documentName: 'Final Accounts', category: 'final-account', group: 'Finalisation' },
    { documentName: 'Final Approval Certificate', category: 'final-approval', group: 'Finalisation' },
    { documentName: 'Proof of Payment', category: 'proof-of-payment', group: 'Finalisation' },
    { documentName: 'Operations and Maintenance Manuals', category: 'om-manual', group: 'Finalisation' },
  ],
  10: [],
};
