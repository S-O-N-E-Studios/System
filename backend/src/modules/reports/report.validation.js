const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const deptSummaryQuerySchema = Joi.object({
  deptId: objectId.required(),
});

const generateReportSchema = Joi.object({
  reportType: Joi.string()
    .valid(
      'dashboard',
      'dept-summary',
      'payment-forecast',
      'project-status',
      'sprint-burndown',
      'grants-summary',
    )
    .required(),
  filters: Joi.object().default({}),
  format: Joi.string().valid('json', 'pdf', 'xlsx').default('json'),
});

module.exports = {
  deptSummaryQuerySchema,
  generateReportSchema,
};
