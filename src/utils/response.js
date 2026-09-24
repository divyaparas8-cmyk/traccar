const sendSuccess = (res, statusCode = 200, message = 'Request successful', data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const sendPaginated = (res, statusCode = 200, message = 'Request successful', data = [], pagination = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 20,
      total: pagination.total || 0,
      totalPages: pagination.totalPages || 1
    }
  });
};

const sendError = (res, statusCode = 500, message = 'Something went wrong', errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

module.exports = {
  sendSuccess,
  sendPaginated,
  sendError
};
