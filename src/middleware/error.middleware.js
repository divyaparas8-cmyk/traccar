const env = require('../config/env');
const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errors = err.errors || [];

  // Handle Zod Validation Errors
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation error';
    errors = err.issues ? err.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    })) : err.errors;
  }

  // Handle Prisma Unique Constraint Error (P2002)
  if (err.code === 'P2002') {
    statusCode = 409;
    const targetField = err.meta?.target ? err.meta.target.join(', ') : 'field';
    message = `A record with this ${targetField} already exists.`;
  }

  // Handle Prisma Record Not Found Error (P2025)
  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Requested record was not found.';
  }

  logger.error({
    err,
    url: req.originalUrl,
    method: req.method,
    statusCode
  }, message);

  const responsePayload = {
    success: false,
    message,
    errors
  };

  if (env.NODE_ENV === 'development' && err.stack) {
    responsePayload.stack = err.stack;
  }

  return res.status(statusCode).json(responsePayload);
};

module.exports = errorHandler;
