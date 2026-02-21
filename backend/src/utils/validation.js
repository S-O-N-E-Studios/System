// Joi validation schemas - extend as needed
const Joi = require('joi');

module.exports = {
  loginSchema: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  registerSchema: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  })
};
