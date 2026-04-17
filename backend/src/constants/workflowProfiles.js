const WORKFLOW_PROFILES = {
  MUNICIPAL_V8: 'municipal_v8',
  PRIVATE_V8: 'private_v8',
};

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
    { documentName: 'Monthly Progress Reports', category: 'progress-report', group: 'Construction' },
    { documentName: 'Monthly Safety Reports', category: 'safety-report', group: 'Construction' },
    { documentName: 'Monthly Cash Flows', category: 'monthly-cash-flow', group: 'Construction' },
    { documentName: 'Payment Certificates', category: 'payment-certificate', group: 'Construction' },
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
  3: ['detailed-design-report', 'detailed-design', 'detailed-cost-estimate'],
  4: ['tender-document', 'tender-evaluation', 'tender-drawing', 'appointment-letter'],
  5: [],
  6: ['appointment-letter'],
  7: ['payment-certificate', 'progress-report', 'safety-report', 'monthly-cash-flow'],
  8: ['practical-completion', 'defects-list'],
  9: ['final-approval', 'proof-of-payment', 'final-account', 'as-built-drawing', 'om-manual'],
};

const MUNICIPAL_APPROVAL_REQUIRED_CATEGORIES = [
  'scoping-report',
  'preliminary-design-report',
  'detailed-design-report',
  'tender-document',
  'tender-evaluation',
  'appointment-letter',
  'payment-certificate',
  'variation-certificate',
  'practical-completion',
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
