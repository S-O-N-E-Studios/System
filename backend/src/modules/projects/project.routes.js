const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('./project.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const { requirePM, requireOrgAdmin, denyClientTemp } = require('../../middleware/rbac.middleware');
const { requireProjectScope } = require('../../middleware/clientAccess.middleware');
const {
  createProjectSchema,
  updateProjectSchema,
  createPaymentSchema,
  updatePaymentSchema,
  forecastEntrySchema,
  projectListQuerySchema,
} = require('./project.validation');

router.get('/',
  validate(projectListQuerySchema, 'query'),
  asyncHandler(ctrl.list)
);

router.post('/',
  denyClientTemp,
  requirePM,
  validate(createProjectSchema),
  asyncHandler(ctrl.create)
);

router.get('/budget-summary',
  denyClientTemp,
  asyncHandler(ctrl.getBudgetSummary)
);

router.get('/:id',
  requireProjectScope,
  asyncHandler(ctrl.getOne)
);

router.patch('/:id',
  denyClientTemp,
  requirePM,
  validate(updateProjectSchema),
  asyncHandler(ctrl.update)
);

router.delete('/:id',
  denyClientTemp,
  requireOrgAdmin,
  asyncHandler(ctrl.remove)
);

router.get('/:id/stage-status',
  requireProjectScope,
  asyncHandler(ctrl.getStageStatus)
);

router.post('/:id/advance-stage',
  denyClientTemp,
  requirePM,
  asyncHandler(ctrl.advanceStage)
);

router.get('/:id/payments',
  requireProjectScope,
  asyncHandler(ctrl.listPayments)
);

router.post('/:id/payments',
  denyClientTemp,
  requirePM,
  validate(createPaymentSchema),
  asyncHandler(ctrl.addPayment)
);

router.patch('/:id/payments/:payId',
  denyClientTemp,
  requirePM,
  validate(updatePaymentSchema),
  asyncHandler(ctrl.updatePayment)
);

router.get('/:id/payment-forecast',
  requireProjectScope,
  asyncHandler(ctrl.getPaymentForecast)
);

router.post('/:id/payment-forecast',
  denyClientTemp,
  requirePM,
  validate(forecastEntrySchema),
  asyncHandler(ctrl.upsertForecast)
);

// Sub-routes: activities, funding sources, approvals, variations, media
try { router.use('/:id/approvals', requireProjectScope, require('../stage-gate/stageGate.routes')); } catch (e) { /* module not yet available */ }
try { router.use('/:id/variations', requireProjectScope, require('../stage-gate/variationOrder.routes')); } catch (e) { /* module not yet available */ }
try { router.use('/:id/funding-sources', requireProjectScope, require('../funding-sources/fundingSource.routes')); } catch (e) { /* module not yet available */ }
try { router.use('/:id/activities', requireProjectScope, require('../activities/activity.routes')); } catch (e) { /* module not yet available */ }
try { router.use('/:id/media', requireProjectScope, require('../files/media.routes')); } catch (e) { /* module not yet available */ }

module.exports = router;
