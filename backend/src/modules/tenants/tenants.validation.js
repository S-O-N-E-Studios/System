const Joi = require('joi');

const themeSchema = Joi.object({
  primaryColour: Joi.string().trim(),
  fontHeading: Joi.string().trim(),
  fontBody: Joi.string().trim(),
  defaultMode: Joi.string().valid('light', 'dark'),
});

const updateTenantSchema = Joi.object({
  name: Joi.string().min(2).max(200).trim(),
  orgType: Joi.string().valid('provincial_gov', 'private_firm'),
  plan: Joi.string().trim(),
  primaryContact: Joi.string().trim().allow(null, ''),
  emailDomain: Joi.string().trim().allow(null, ''),
  localMunicipalities: Joi.array().items(Joi.string().trim()),
  logoUrl: Joi.string().trim().allow(null, ''),
  status: Joi.string().valid('active', 'suspended', 'trial'),
  theme: themeSchema,
});

module.exports = {
  updateTenantSchema,
};
