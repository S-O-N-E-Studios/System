const Joi = require('joi');

const outboundEmailSchema = Joi.object({
  enabled: Joi.boolean(),
  host: Joi.string().max(255).trim().allow(null, ''),
  port: Joi.number().integer().min(1).max(65535),
  secure: Joi.boolean(),
  authUser: Joi.string().max(255).trim().allow(null, ''),
  /** Non-empty sets a new password; empty string clears stored credentials. Omit to leave unchanged. */
  authPass: Joi.string().max(512).allow(null, ''),
  fromName: Joi.string().max(120).trim().allow(null, ''),
  fromAddress: Joi.string().max(255).lowercase().trim().allow(null, ''),
  replyTo: Joi.string().max(255).lowercase().trim().allow(null, ''),
});

const updateOrganizationSchema = Joi.object({
  name: Joi.string().min(2).max(200).trim(),
  primaryContact: Joi.string().trim().allow(null, ''),
  /** Absolute URL or same-origin path e.g. `/uploads/...` */
  logoUrl: Joi.string().trim().allow(null, ''),
  localMunicipalities: Joi.array().items(Joi.string().trim()),
  theme: Joi.object({
    primaryColour: Joi.string().pattern(/^#[0-9a-fA-F]{6}$/),
    fontHeading: Joi.string().max(60),
    fontBody: Joi.string().max(60),
    defaultMode: Joi.string().valid('light', 'dark'),
  }),
  outboundEmail: outboundEmailSchema,
});

module.exports = {
  updateOrganizationSchema,
};
