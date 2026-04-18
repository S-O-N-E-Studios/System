
//  * Factory that wraps Joi schemas into Express middleware.
//  * On validation failure, returns a 422 with the first error message.
//  * On success, replaces req.body with the validated + sanitised value.
//  *
//  * Usage:
//  *   router.post('/login', validate(loginSchema), asyncHandler(controller.login))


const { sendValidationError } = require('../utils/apiResponse');


const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly:   true,   // Return the first error only — cleaner for auth flows
    stripUnknown: true,   // Remove any keys not in the schema
    convert:      true,   // Coerce types where possible (e.g. string -> lowercase)
  });

  if (error) {
    const message = error.details[0]?.message || 'Validation failed';
    return sendValidationError(res, message);
  }

  req[source] = value; 
  return next();
};

module.exports = validate;