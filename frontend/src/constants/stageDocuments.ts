/* Stage document requirements — aligned to v9 hybrid (legacy stages 0–10). */

import type { ProjectStage } from '@/types';

export interface StageDocumentSpec {
  documentName: string;
  category: string;
  group?: string;
  recurring?: boolean;
}

export const STAGE_DOCUMENT_REQUIREMENTS: Record<ProjectStage, StageDocumentSpec[]> = {
  0: [],
  1: [
    { documentName: 'Signed Scoping Report', category: 'scoping-report', group: 'Inception' },
  ],
  2: [
    { documentName: 'Preliminary Design Report', category: 'preliminary-design-report', group: 'Planning' },
    { documentName: 'Preliminary Drawings', category: 'preliminary-design', group: 'Planning' },
    { documentName: 'Preliminary Cost Estimates', category: 'preliminary-cost-estimate', group: 'Planning' },
    { documentName: 'Digital Survey', category: 'digital-survey', group: 'Specialist Inputs' },
    { documentName: 'Geo-Technical Report', category: 'geotechnical', group: 'Specialist Inputs' },
    { documentName: 'Environmental / EIA or EMP', category: 'environmental', group: 'Specialist Inputs' },
    { documentName: 'Community Minutes', category: 'community-minutes', group: 'Specialist Inputs' },
  ],
  3: [
    { documentName: 'Detailed Design Report', category: 'detailed-design-report', group: 'Execution' },
    { documentName: 'Detailed Drawings', category: 'detailed-design', group: 'Execution' },
    { documentName: 'Detailed Cost Estimates', category: 'detailed-cost-estimate', group: 'Execution' },
    { documentName: 'Draft Tender Document', category: 'tender-document', group: 'Planning' },
  ],
  4: [
    { documentName: 'Tender Advert and Register', category: 'tender-register', group: 'Tender' },
    { documentName: 'Pre-Evaluation Report', category: 'pre-evaluation-report', group: 'Tender' },
    { documentName: 'Evaluation Report', category: 'evaluation-report', group: 'Tender' },
    { documentName: 'Adjudication Report', category: 'adjudication-report', group: 'Tender' },
    { documentName: 'Tender Document', category: 'tender-document', group: 'Tender' },
    { documentName: 'Tender Drawings', category: 'tender-drawing', group: 'Tender' },
    { documentName: 'Contractor Appointment Letter', category: 'appointment-letter', group: 'Tender' },
  ],
  5: [],
  6: [
    { documentName: 'Site Handover Minutes', category: 'site-handover-minutes', group: 'Site Handover' },
    { documentName: 'Surety / Guarantee', category: 'surety-guarantee', group: 'Site Handover' },
    { documentName: 'Insurance of Works', category: 'insurance-of-works', group: 'Site Handover' },
    { documentName: 'Programme of Works', category: 'programme-of-works', group: 'Site Handover' },
    { documentName: 'Key Personnel Register', category: 'key-personnel-register', group: 'Site Handover' },
    { documentName: 'Safety File Audit Report', category: 'safety-file-audit-report', group: 'Site Handover' },
  ],
  7: [
    { documentName: 'Monthly Progress Reports', category: 'progress-report', group: 'Construction', recurring: true },
    { documentName: 'Monthly Safety Reports', category: 'safety-report', group: 'Construction', recurring: true },
    { documentName: 'Monthly Cash Flows', category: 'monthly-cash-flow', group: 'Construction', recurring: true },
    { documentName: 'Monthly Minutes', category: 'meeting-minutes', group: 'Construction', recurring: true },
    { documentName: 'Payment Certificates', category: 'payment-certificate', group: 'Construction', recurring: true },
  ],
  8: [
    { documentName: 'Practical Completion Certificate', category: 'practical-completion', group: 'Close-Out' },
    { documentName: 'Defects List', category: 'defects-list', group: 'Close-Out' },
  ],
  9: [
    { documentName: 'Final Account', category: 'final-account', group: 'Finalisation' },
    { documentName: 'Completion Certificate', category: 'completion-certificate', group: 'Finalisation' },
    { documentName: 'Close-Out Report — Principal Agent', category: 'closeout-report-principal', group: 'Finalisation' },
    { documentName: 'Close-Out Report — Safety Consultant', category: 'closeout-report-safety', group: 'Finalisation' },
    { documentName: 'Close-Out Report — EIA', category: 'closeout-report-eia', group: 'Finalisation' },
    { documentName: 'Final Completion Certificate', category: 'final-completion', group: 'Finalisation' },
    { documentName: 'Proof of Payment', category: 'proof-of-payment', group: 'Finalisation' },
    { documentName: 'As-built Drawings', category: 'as-built-drawing', group: 'Finalisation' },
    { documentName: 'Operations and Maintenance Manuals', category: 'om-manual', group: 'Finalisation' },
    { documentName: 'Final Approval Certificate', category: 'final-approval', group: 'Finalisation' },
  ],
  10: [],
};
