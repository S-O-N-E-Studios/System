const Joi = require('joi');

const notificationPreferencesSchema = Joi.object({
  projectUpdates: Joi.boolean(),
  taskAssignments: Joi.boolean(),
  reportSubmissions: Joi.boolean(),
  deadlineReminders: Joi.boolean(),
  teamInvitations: Joi.boolean(),
});

const markReadSchema = Joi.object({
  id: Joi.string().trim().required(),
});

module.exports = {
  notificationPreferencesSchema,
  markReadSchema,
};
