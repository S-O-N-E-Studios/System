const Joi = require('joi');

const updateOrganizationSchema = Joi.object({
  name: Joi.string().min(2).max(200).trim(),
  primaryContact: Joi.string().trim().allow(null, ''),
  logoUrl: Joi.string().uri().allow(null, ''),
  localMunicipalities: Joi.array().items(Joi.string().trim()),
  theme: Joi.object({
    primaryColour: Joi.string().pattern(/^#[0-9a-fA-F]{6}$/),
    fontHeading: Joi.string().max(60),
    fontBody: Joi.string().max(60),
    defaultMode: Joi.string().valid('light', 'dark'),
  }),
});

module.exports = {
  updateOrganizationSchema,
};
