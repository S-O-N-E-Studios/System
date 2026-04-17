
//  * Global Express error handler. Must be registered last in app.js.
//  * Catches anything thrown from async handlers via asyncHandler().
//  *
//  * Maps known error types to appropriate HTTP status codes.
//  * Never leaks stack traces in production.


const env = require('../config/env');


const errorHandler = (err, req, res, next) => {
  let status  = err.status || err.statusCode || 500;
  let message = err.message || 'An unexpected error occurred';
  let code    = err.code    || 'INTERNAL_ERROR';

  //  Mongoose errors 

  // Duplicate key (e.g. unique email)
  if (err.name === 'MongoServerError' && err.code === 11000) {
    status  = 409;
    code    = 'CONFLICT';
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `A record with this ${field} already exists`;
  }

  // Validation error (Mongoose schema validation)
  if (err.name === 'ValidationError') {
    status  = 422;
    code    = 'VALIDATION_ERROR';
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  // CastError (invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    status  = 400;
    code    = 'INVALID_ID';
    message = `Invalid ID format for field: ${err.path}`;
  }

  //  JWT errors 

  if (err.name === 'JsonWebTokenError') {
    status  = 401;
    code    = 'INVALID_TOKEN';
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    status  = 401;
    code    = 'TOKEN_EXPIRED';
    message = 'Token has expired';
  }

  //  Response 

  const body = {
    success: false,
    error:   code,
    message,
  };
  if (err.details !== undefined) {
    body.details = err.details;
  }

  // Only include stack trace in development
  if (env.isDevelopment && err.stack) {
    body.stack = err.stack;
  }

  return res.status(status).json(body);
};


const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error:   'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};