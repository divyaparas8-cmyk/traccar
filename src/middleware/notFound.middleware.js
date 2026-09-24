const AppError = require('../utils/appError');

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server.`, 404));
};

module.exports = notFoundHandler;
