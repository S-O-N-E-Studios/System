/* Stage document requirements per v6.0 MVP doc §4.1 & §4.4 */

import type { ProjectStage } from '@/types';

export interface StageDocumentSpec {
  documentName: string;
  category: string;
  recurring?: boolean; // Stage 5: Monthly reports can be uploaded multiple times
}

export const STAGE_DOCUMENT_REQUIREMENTS: Record<ProjectStage, StageDocumentSpec[]> = {
  1: [
    { documentName: 'Signed Scoping Report', category: 'scoping-report' },
    { documentName: 'Quotations for surveys and investigations', category: 'quotation' },
    { documentName: 'Approval of quotations', category: 'quotation' },
    { documentName: 'Appointment letters for service providers', category: 'appointment-letter' },
  ],
  2: [
    { documentName: 'Preliminary Designs', category: 'preliminary-design' },
    { documentName: 'Preliminary Drawings', category: 'preliminary-design' },
    { documentName: 'Signed Preliminary Design Report', category: 'preliminary-design-report' },
    { documentName: 'Preliminary Cost Estimates', category: 'preliminary-cost-estimate' },
  ],
  3: [
    { documentName: 'Detailed Designs', category: 'detailed-design' },
    { documentName: 'Detailed Drawings', category: 'detailed-design' },
    { documentName: 'Signed Detailed Design Report', category: 'detailed-design-report' },
    { documentName: 'Detailed Cost Estimates', category: 'detailed-cost-estimate' },
  ],
  4: [
    { documentName: 'Tender Drawings', category: 'tender-drawing' },
    { documentName: 'Tender Document', category: 'tender-document' },
    { documentName: 'Tender Evaluation Report', category: 'tender-evaluation' },
    { documentName: 'Appointment Letters of Contractor', category: 'appointment-letter' },
  ],
  5: [
    { documentName: 'Pre-commencement Documents', category: 'pre-commencement' },
    { documentName: 'Monthly Cash Flows', category: 'monthly-cash-flow', recurring: true },
    { documentName: 'Monthly Progress Reports', category: 'progress-report', recurring: true },
    { documentName: 'Monthly Safety Reports', category: 'safety-report', recurring: true },
    { documentName: 'Payment Certificates', category: 'payment-certificate', recurring: true },
    { documentName: 'Final Accounts', category: 'final-account' },
    { documentName: 'Practical Completion Certificates', category: 'practical-completion' },
    { documentName: 'Completion Certificates', category: 'completion-certificate' },
  ],
  6: [
    { documentName: 'As-built Drawings', category: 'as-built-drawing' },
    { documentName: 'Final Approval Certificate', category: 'final-approval' },
    { documentName: 'Proof of Payment', category: 'proof-of-payment' },
  ],
};
