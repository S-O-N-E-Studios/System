//
 //  *  auth validation schemas
 //  *  joi validation for all authentication request bodies
 //  *  used by validation middleware before hitting the controller

const Joi = require('joi');
const { ROLES } = require("../../constants/roles");

// Reusable field validators
const email = Joi.string().email().lowercase().required();
const password = Joi.string().min(6).max(128).required();
const name = Joi.string().min(2).max(100).trim().required();

// schemas

// POST /auth/login

const loginSchema = Joi.object({
  email,
  password: Joi.string().required(), 
  
});

// POST /auth/register-org
// 3 step registration wizard for organizations
// org type affects tenants structure (provincial or private)

const registerOrgSchema = Joi.object({
  fullName: name,
  email,
  password,

  orgName: Joi.string().min(1).max(150).required(),
  orgType: Joi.string().valid("provincial_gov", "private_firm").required(),
  orgSlug: Joi.string()
    .min(2)
    .max(60)
    .lowercase()
    .trim()
    .pattern(/^[a-z0-9-]+$/)
    .required()
    .messages({
      "string.pattern.base":
        "Slug can only contain lowercase letters, numbers, and hyphens",
    }),
  emailDomain: Joi.string().trim().optional().allow("", null), 


  localMunicipalities: Joi.when("orgType", {
    is: "provincial_gov",
    then: Joi.array().items(Joi.string().trim()).min(1).required(),
    otherwise: Joi.array().items(Joi.string().trim()).optional().default([]),
  }),
});

// POST /auth/accept-invite/:token
const acceptInviteSchema = Joi.object({
  name,
  password,
});

// POST /auth/client-activate/:token
// Client sets their password on first activation

const clientActivateSchema = Joi.object({
  password,
});

// POST /auth/forgot-password
const forgotPasswordSchema = Joi.object({
  email,
});

// POST /auth/reset-password/:token
const resetPasswordSchema = Joi.object({
  password,
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
  }),
});

// POST /auth/change-password
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(128).required(),
  confirmNewPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "New passwords do not match",
    }),
});

// POST /auth/refresh
const refreshSchema = Joi.object({}).optional(); 

module.exports = {
  loginSchema,
  registerOrgSchema,
  acceptInviteSchema,
  clientActivateSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  refreshSchema,
};
