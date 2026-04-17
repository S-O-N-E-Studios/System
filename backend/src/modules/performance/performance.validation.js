const Joi = require('joi');

const ragSchema = Joi.string().valid('red', 'amber', 'green').required();
const pctSchema = Joi.number().min(0).max(100).required();

const upsertPerformanceSchema = Joi.object({
  period: Joi.string().pattern(/^\d{4}-\d{2}$/).required(),
  consultant: Joi.object({
    rag: ragSchema,
    progressProjectedPct: pctSchema,
    progressActualPct: pctSchema,
    expenditureProjectedPct: pctSchema,
    expenditureActualPct: pctSchema,
  }).required(),
  construction: Joi.object({
    rag: ragSchema,
    progressProjectedPct: pctSchema,
    progressActualPct: pctSchema,
    expenditureProjectedPct: pctSchema,
    expenditureActualPct: pctSchema,
    timeProjectedPct: pctSchema,
    timeActualPct: pctSchema,
  }).required(),
});

module.exports = {
  upsertPerformanceSchema,
};
