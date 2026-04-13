const { STAGE_DOCUMENT_MAP, APPROVAL_REQUIRED_CATEGORIES } = require('../../constants/fileCategories');

const STAGE_NAMES = {
  0: 'Multi-Year Planning',
  1: 'Inception',
  2: 'Concept and Viability',
  3: 'Design Development',
  4: 'Documentation and Procurement',
  5: 'Tender Stage',
  6: 'Contractor Appointment',
  7: 'Construction',
  8: 'Practical Completion',
  9: 'Close-Out',
  10: 'Complete',
};

const STAGES_REQUIRING_APPROVAL = [1, 2, 3, 4, 6, 7, 8, 9];
const STAGES_NO_APPROVAL = [0, 5, 10];

module.exports = {
  STAGE_NAMES,
  STAGE_DOCUMENT_MAP,
  APPROVAL_REQUIRED_CATEGORIES,
  STAGES_REQUIRING_APPROVAL,
  STAGES_NO_APPROVAL,
};
