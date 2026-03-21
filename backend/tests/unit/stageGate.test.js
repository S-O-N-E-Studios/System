/**
 * Unit tests: Stage Gate Service
 * Tests all 4 scenarios from MVP doc section 4.2
 */

require('../setup');
const mongoose = require('mongoose');
const { checkStageGate } = require('../../src/services/stageGate.service');
const {
  createTenantWithAdmin,
  createProject,
  createFileDoc,
  uploadStage1Docs,
} = require('../helpers/fixtures');

describe('Stage Gate Service', () => {
  let tenant, project;

  beforeEach(async () => {
    ({ tenant } = await createTenantWithAdmin());
    project = await createProject(tenant._id);
  });

  // ─── Scenario 1: All required documents present ───────────────────────────
  describe('Scenario 1: Gate passes when all docs present', () => {
    it('returns passed: true for Stage 1 when all 3 documents are uploaded', async () => {
      await uploadStage1Docs(tenant._id, project._id, new mongoose.Types.ObjectId());

      const result = await checkStageGate(project._id, tenant._id, 1);

      expect(result.passed).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('returns passed: true for Stage 2 when all 3 documents are uploaded', async () => {
      const categories = ['preliminary-design', 'preliminary-design-report', 'preliminary-cost-estimate'];
      for (const category of categories) {
        await createFileDoc(tenant._id, project._id, { stage: 2, category });
      }

      const result = await checkStageGate(project._id, tenant._id, 2);

      expect(result.passed).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('returns passed: true for Stage 6 when all 3 close-out docs present (including proof-of-payment)', async () => {
      const categories = ['as-built-drawing', 'final-approval', 'proof-of-payment'];
      for (const category of categories) {
        await createFileDoc(tenant._id, project._id, { stage: 6, category });
      }

      const result = await checkStageGate(project._id, tenant._id, 6);

      expect(result.passed).toBe(true);
    });
  });

  // ─── Scenario 2: Documents missing → 422 data ────────────────────────────
  describe('Scenario 2: Gate fails and returns missing documents', () => {
    it('returns passed: false with ALL missing docs when nothing uploaded', async () => {
      const result = await checkStageGate(project._id, tenant._id, 1);

      expect(result.passed).toBe(false);
      expect(result.missing).toHaveLength(3);
      const categories = result.missing.map(m => m.category);
      expect(categories).toContain('scoping-report');
      expect(categories).toContain('quotation');
      expect(categories).toContain('appointment-letter');
    });

    it('returns passed: false with only the missing docs when some are uploaded', async () => {
      // Upload only scoping-report
      await createFileDoc(tenant._id, project._id, { stage: 1, category: 'scoping-report' });

      const result = await checkStageGate(project._id, tenant._id, 1);

      expect(result.passed).toBe(false);
      expect(result.missing).toHaveLength(2);
      const categories = result.missing.map(m => m.category);
      expect(categories).not.toContain('scoping-report');
      expect(categories).toContain('quotation');
      expect(categories).toContain('appointment-letter');
    });

    it('returns human-readable document names in missing list', async () => {
      const result = await checkStageGate(project._id, tenant._id, 1);

      const scoringDoc = result.missing.find(m => m.category === 'scoping-report');
      expect(scoringDoc.documentName).toBe('Signed Scoping Report');
    });

    it('does not count soft-deleted files towards gate', async () => {
      const File = require('../../src/models/File');
      // Upload then soft-delete a scoping report
      const file = await createFileDoc(tenant._id, project._id, { stage: 1, category: 'scoping-report' });
      await File.findByIdAndUpdate(file._id, { isDeleted: true });

      const result = await checkStageGate(project._id, tenant._id, 1);

      expect(result.passed).toBe(false);
      const categories = result.missing.map(m => m.category);
      expect(categories).toContain('scoping-report'); // Should be missing again
    });
  });

  // ─── Scenario 3: Final stage gate passes → project complete ──────────────
  describe('Scenario 3: Stage 5 recurring documents (at least one required)', () => {
    it('Stage 5 gate passes with at least one of each recurring document type', async () => {
      const stage5Cats = [
        'pre-commencement', 'monthly-cash-flow', 'progress-report',
        'safety-report', 'payment-certificate', 'final-account',
        'practical-completion', 'completion-certificate',
      ];

      for (const category of stage5Cats) {
        await createFileDoc(tenant._id, project._id, { stage: 5, category });
      }

      const result = await checkStageGate(project._id, tenant._id, 5);
      expect(result.passed).toBe(true);
    });

    it('Stage 5 gate fails if any required doc type is missing', async () => {
      // Upload all EXCEPT payment-certificate
      const stage5Cats = [
        'pre-commencement', 'monthly-cash-flow', 'progress-report',
        'safety-report', 'final-account', 'practical-completion', 'completion-certificate',
      ];

      for (const category of stage5Cats) {
        await createFileDoc(tenant._id, project._id, { stage: 5, category });
      }

      const result = await checkStageGate(project._id, tenant._id, 5);
      expect(result.passed).toBe(false);
      expect(result.missing.map(m => m.category)).toContain('payment-certificate');
    });
  });

  // ─── Scenario 4: Wrong stage document ────────────────────────────────────
  describe('Scenario 4: Cross-stage document isolation', () => {
    it('Stage 1 gate does NOT count Stage 2 documents', async () => {
      // Upload Stage 2 docs (wrong stage for Stage 1 check)
      const stage2Cats = ['preliminary-design', 'preliminary-design-report', 'preliminary-cost-estimate'];
      for (const category of stage2Cats) {
        await createFileDoc(tenant._id, project._id, { stage: 2, category });
      }

      // Stage 1 gate should still fail
      const result = await checkStageGate(project._id, tenant._id, 1);
      expect(result.passed).toBe(false);
    });
  });
});
