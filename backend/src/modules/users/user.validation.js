
const Joi = require('joi');
const { ROLES } = require('../../constants/roles');

const updateProfileSchema = Joi.object({
  fullName:  Joi.string().min(2).max(100).trim(),
  avatarUrl: Joi.string().uri().allow(null, ''),
});
 
const inviteUserSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  role: Joi.string()
    .valid(ROLES.ORG_ADMIN, ROLES.DEPT_ADMIN, ROLES.PM, ROLES.MEMBER, ROLES.VIEWER)
    .required(),
  deptId: Joi.when('role', {
    is:        ROLES.DEPT_ADMIN,
    then:      Joi.string().hex().length(24).required(),
    otherwise: Joi.string().hex().length(24).allow(null, ''),
  }),
});

const updateUserRoleSchema = Joi.object({
  role: Joi.string()
    .valid(ROLES.ORG_ADMIN, ROLES.DEPT_ADMIN, ROLES.PM, ROLES.MEMBER, ROLES.VIEWER)
    .required(),
  deptId: Joi.when('role', {
    is:        ROLES.DEPT_ADMIN,
    then:      Joi.string().hex().length(24).required(),
    otherwise: Joi.string().hex().length(24).allow(null, ''),
  }),
});
 
module.exports = {
  updateProfileSchema,
  inviteUserSchema,
  updateUserRoleSchema,
};