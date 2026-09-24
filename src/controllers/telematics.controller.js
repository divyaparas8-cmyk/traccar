const telematicsService = require('../services/telematics.service');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

class TelematicsController {
  getLivePositions = asyncHandler(async (req, res) => {
    const data = await telematicsService.getLivePositions(req.user, req.query);
    return sendSuccess(res, 200, 'Live telematics stream retrieved', data);
  });

  getRouteHistory = asyncHandler(async (req, res) => {
    const { vehicleId, date, startTime, endTime } = req.query;
    const data = await telematicsService.getRouteHistory(vehicleId, date, startTime, endTime);
    return sendSuccess(res, 200, 'Route history waypoints retrieved', data);
  });
}

module.exports = new TelematicsController();
