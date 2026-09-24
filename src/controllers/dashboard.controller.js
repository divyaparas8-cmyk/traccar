const dashboardService = require('../services/dashboard.service');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

class DashboardController {
  getStats = asyncHandler(async (req, res) => {
    const stats = await dashboardService.getDashboardStats(req.user, req.query);
    return sendSuccess(res, 200, 'Dashboard statistics calculated', stats);
  });
}

module.exports = new DashboardController();
