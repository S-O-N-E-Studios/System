const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('./project.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const {
  requirePM,
  requireOrgAdmin,
  requireConsultantOperator,
  requireClientApprover,
  denyClientTemp,
} = require('../../middleware/rbac.middleware');
const { requireProjectScope } = require('../../middleware/clientAccess.middleware');
const {
  createProjectSchema,
  updateProjectSchema,
  createPaymentSchema,
  updatePaymentSchema,
  forecastEntrySchema,
  projectListQuerySchema,
  deliverablesListQuerySchema,
  deliverableStageQuerySchema,
  deliverableUploadSchema,
  rejectDeliverableSchema,
  appointmentSchema,
  updateAppointmentSchema,
  appointmentStepActionSchema,
  interimCertificateCreateSchema,
  interimCertificateReviewSchema,
  closeOutReportSchema,
  closeOutReportActionSchema,
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

router.get('/:id/client-access-check',
  requireProjectScope,
  asyncHandler(ctrl.getClientAccessCheck)
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
  requireConsultantOperator,
  asyncHandler(ctrl.advanceStage)
);

router.get('/:id/payments',
  requireProjectScope,
  asyncHandler(ctrl.listPayments)
);
router.get('/:id/payment-certificates',
  requireProjectScope,
  asyncHandler(ctrl.listPayments)
);

router.post('/:id/payments',
  denyClientTemp,
  requireConsultantOperator,
  validate(createPaymentSchema),
  asyncHandler(ctrl.addPayment)
);
router.post('/:id/payment-certificates',
  denyClientTemp,
  requireConsultantOperator,
  validate(createPaymentSchema),
  asyncHandler(ctrl.addPayment)
);

router.get('/:id/interim-payment-certificates',
  requireProjectScope,
  asyncHandler(ctrl.listInterimPaymentCertificates)
);

router.get('/:id/interim-payment-certificates/:pcId',
  requireProjectScope,
  asyncHandler(ctrl.getInterimPaymentCertificate)
);

router.post('/:id/interim-payment-certificates',
  requireProjectScope,
  denyClientTemp,
  requireConsultantOperator,
  validate(interimCertificateCreateSchema),
  asyncHandler(ctrl.createInterimPaymentCertificate)
);

router.post('/:id/interim-payment-certificates/:pcId/approve',
  requireProjectScope,
  requireClientApprover,
  validate(interimCertificateReviewSchema),
  asyncHandler(ctrl.approveInterimPaymentCertificate)
);

router.post('/:id/interim-payment-certificates/:pcId/reject',
  requireProjectScope,
  requireClientApprover,
  validate(interimCertificateReviewSchema),
  asyncHandler(ctrl.rejectInterimPaymentCertificate)
);

router.patch('/:id/payments/:payId',
  denyClientTemp,
  requireConsultantOperator,
  validate(updatePaymentSchema),
  asyncHandler(ctrl.updatePayment)
);
router.patch('/:id/payment-certificates/:payId',
  denyClientTemp,
  requireConsultantOperator,
  validate(updatePaymentSchema),
  asyncHandler(ctrl.updatePayment)
);

router.get('/:id/payment-forecast',
  requireProjectScope,
  asyncHandler(ctrl.getPaymentForecast)
);
router.get('/:id/billing-periods',
  requireProjectScope,
  asyncHandler(ctrl.listBillingPeriods)
);
router.get('/:id/billing-periods/:period',
  requireProjectScope,
  asyncHandler(ctrl.getBillingPeriodDetail)
);

router.post('/:id/payment-forecast',
  denyClientTemp,
  requireConsultantOperator,
  validate(forecastEntrySchema),
  asyncHandler(ctrl.upsertForecast)
);

router.get('/:id/deliverables',
  requireProjectScope,
  validate(deliverablesListQuerySchema, 'query'),
  asyncHandler(ctrl.listDeliverables)
);

router.get('/:id/deliverables/:key',
  requireProjectScope,
  validate(deliverableStageQuerySchema, 'query'),
  asyncHandler(ctrl.getDeliverable)
);

router.post('/:id/deliverables/:key/upload',
  requireProjectScope,
  denyClientTemp,
  requireConsultantOperator,
  validate(deliverableStageQuerySchema, 'query'),
  validate(deliverableUploadSchema),
  asyncHandler(ctrl.uploadDeliverable)
);

router.post('/:id/deliverables/:key/approve',
  requireProjectScope,
  requireClientApprover,
  validate(deliverableStageQuerySchema, 'query'),
  asyncHandler(ctrl.approveDeliverable)
);

router.post('/:id/deliverables/:key/reject',
  requireProjectScope,
  requireClientApprover,
  validate(deliverableStageQuerySchema, 'query'),
  validate(rejectDeliverableSchema),
  asyncHandler(ctrl.rejectDeliverable)
);

router.get('/:id/appointments',
  requireProjectScope,
  asyncHandler(ctrl.listAppointments)
);

router.post('/:id/appointments',
  requireProjectScope,
  denyClientTemp,
  requireConsultantOperator,
  validate(appointmentSchema),
  asyncHandler(ctrl.createAppointment)
);

router.patch('/:id/appointments/:appId',
  requireProjectScope,
  denyClientTemp,
  requireConsultantOperator,
  validate(updateAppointmentSchema),
  asyncHandler(ctrl.updateAppointment)
);

router.post('/:id/appointments/:appId/steps/:step/approve',
  requireProjectScope,
  denyClientTemp,
  requireClientApprover,
  validate(appointmentStepActionSchema),
  asyncHandler(ctrl.approveAppointmentStep)
);

router.post('/:id/appointments/:appId/steps/:step/reject',
  requireProjectScope,
  denyClientTemp,
  requireClientApprover,
  validate(appointmentStepActionSchema),
  asyncHandler(ctrl.rejectAppointmentStep)
);

router.get('/:id/appointments/stage-status',
  requireProjectScope,
  asyncHandler(ctrl.getAppointmentStageStatus)
);

router.get('/:id/close-out-reports',
  requireProjectScope,
  asyncHandler(ctrl.listCloseOutReports)
);

router.post('/:id/close-out-reports',
  requireProjectScope,
  denyClientTemp,
  requireConsultantOperator,
  validate(closeOutReportSchema),
  asyncHandler(ctrl.createCloseOutReport)
);

router.post('/:id/close-out-reports/:reportType/approve',
  requireProjectScope,
  requireClientApprover,
  validate(closeOutReportActionSchema),
  asyncHandler(ctrl.approveCloseOutReport)
);

router.post('/:id/close-out-reports/:reportType/reject',
  requireProjectScope,
  requireClientApprover,
  validate(closeOutReportActionSchema),
  asyncHandler(ctrl.rejectCloseOutReport)
);
router.post('/:id/billing-periods',
  denyClientTemp,
  requireConsultantOperator,
  validate(forecastEntrySchema),
  asyncHandler(ctrl.upsertForecast)
);

// Sub-routes: activities, funding sources, approvals, variations, media
router.use('/:id/approvals', requireProjectScope, require('../stage-gate/stageGate.routes'));
router.use('/:id/variations', requireProjectScope, require('../stage-gate/variationOrder.routes'));
router.use('/:id/funding-sources', requireProjectScope, require('../funding-sources/fundingSource.routes'));
router.use('/:id/activities', requireProjectScope, require('../activities/activity.routes'));
router.use('/:id/media', requireProjectScope, require('../files/media.routes'));
router.use('/:id/workflow', requireProjectScope, require('../workflow/workflow.routes'));
router.use('/:id/procurement-trails', requireProjectScope, require('../procurement-trails/procurementTrail.routes'));
router.use('/:id/extension-of-time', requireProjectScope, require('../extension-of-time/extensionOfTime.routes'));
router.use('/:id/eot', requireProjectScope, require('../extension-of-time/extensionOfTime.routes'));
router.use('/:id/penalties', requireProjectScope, require('../penalties/penalty.routes'));
router.use('/:id/performance', requireProjectScope, require('../performance/performance.routes'));
router.use('/:id/audit', requireProjectScope, require('../audit/audit.routes'));

module.exports = router;
