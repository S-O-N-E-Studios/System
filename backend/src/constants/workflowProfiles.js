const WORKFLOW_PROFILES = {
  MUNICIPAL_V8: 'municipal_v8',
  PRIVATE_V8: 'private_v8',
};

/** Legacy stage maps aligned to v9 hybrid: planning = 2–3, execution/tender = 4–5, site handover = 6. */
const MUNICIPAL_STAGE_DOCUMENT_SPECS = {
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
    { documentName: 'Monthly Progress Reports', category: 'progress-report', group: 'Construction' },
    { documentName: 'Monthly Safety Reports', category: 'safety-report', group: 'Construction' },
    { documentName: 'Monthly Cash Flows', category: 'monthly-cash-flow', group: 'Construction' },
    { documentName: 'Monthly Minutes', category: 'meeting-minutes', group: 'Construction' },
    { documentName: 'Payment Certificates', category: 'payment-certificate', group: 'Construction' },
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
};

const MUNICIPAL_STAGE_DOCUMENT_MAP = {
  1: ['scoping-report'],
  2: [
    'preliminary-design-report',
    'preliminary-design',
    'preliminary-cost-estimate',
    'digital-survey',
    'geotechnical',
    'environmental',
    'community-minutes',
  ],
  3: ['detailed-design-report', 'detailed-design', 'detailed-cost-estimate', 'tender-document'],
  4: [
    'tender-register',
    'pre-evaluation-report',
    'evaluation-report',
    'adjudication-report',
    'tender-document',
    'tender-drawing',
    'appointment-letter',
  ],
  5: [],
  6: [
    'site-handover-minutes',
    'surety-guarantee',
    'insurance-of-works',
    'programme-of-works',
    'key-personnel-register',
    'safety-file-audit-report',
  ],
  7: ['payment-certificate', 'progress-report', 'safety-report', 'monthly-cash-flow', 'meeting-minutes'],
  8: ['practical-completion', 'defects-list'],
  9: [
    'final-account',
    'completion-certificate',
    'closeout-report-principal',
    'closeout-report-safety',
    'closeout-report-eia',
    'final-completion',
    'proof-of-payment',
    'as-built-drawing',
    'om-manual',
    'final-approval',
  ],
};

const MUNICIPAL_APPROVAL_REQUIRED_CATEGORIES = [
  'scoping-report',
  'preliminary-design-report',
  'detailed-design-report',
  'tender-document',
  'tender-register',
  'pre-evaluation-report',
  'evaluation-report',
  'adjudication-report',
  'appointment-letter',
  'site-handover-minutes',
  'surety-guarantee',
  'insurance-of-works',
  'programme-of-works',
  'key-personnel-register',
  'safety-file-audit-report',
  'payment-certificate',
  'meeting-minutes',
  'variation-certificate',
  'practical-completion',
  'final-account',
  'completion-certificate',
  'closeout-report-principal',
  'closeout-report-safety',
  'closeout-report-eia',
  'final-completion',
  'final-approval',
  'proof-of-payment',
];

const PRIVATE_STAGE_DOCUMENT_MAP = {
  ...MUNICIPAL_STAGE_DOCUMENT_MAP,
};
const PRIVATE_STAGE_DOCUMENT_SPECS = {
  ...MUNICIPAL_STAGE_DOCUMENT_SPECS,
};
const PRIVATE_APPROVAL_REQUIRED_CATEGORIES = [...MUNICIPAL_APPROVAL_REQUIRED_CATEGORIES];

const getWorkflowProfileForTenant = (tenant) => {
  if (tenant?.workflowProfile) return tenant.workflowProfile;
  if (tenant?.orgType === 'provincial_gov') return WORKFLOW_PROFILES.MUNICIPAL_V8;
  return WORKFLOW_PROFILES.PRIVATE_V8;
};

const getStageDocumentMapForTenant = (tenant) => {
  const profile = getWorkflowProfileForTenant(tenant);
  if (profile === WORKFLOW_PROFILES.PRIVATE_V8) return PRIVATE_STAGE_DOCUMENT_MAP;
  return MUNICIPAL_STAGE_DOCUMENT_MAP;
};

const getStageDocumentSpecsForTenant = (tenant) => {
  const profile = getWorkflowProfileForTenant(tenant);
  if (profile === WORKFLOW_PROFILES.PRIVATE_V8) return PRIVATE_STAGE_DOCUMENT_SPECS;
  return MUNICIPAL_STAGE_DOCUMENT_SPECS;
};

const getApprovalRequiredCategoriesForTenant = (tenant) => {
  const profile = getWorkflowProfileForTenant(tenant);
  if (profile === WORKFLOW_PROFILES.PRIVATE_V8) return PRIVATE_APPROVAL_REQUIRED_CATEGORIES;
  return MUNICIPAL_APPROVAL_REQUIRED_CATEGORIES;
};

module.exports = {
  WORKFLOW_PROFILES,
  MUNICIPAL_STAGE_DOCUMENT_MAP,
  PRIVATE_STAGE_DOCUMENT_MAP,
  getWorkflowProfileForTenant,
  getStageDocumentMapForTenant,
  getStageDocumentSpecsForTenant,
  getApprovalRequiredCategoriesForTenant,
};
