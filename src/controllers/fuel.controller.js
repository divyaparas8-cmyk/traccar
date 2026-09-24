const fuelService = require('../services/fuel.service');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

class FuelController {
  getFuelLogs = asyncHandler(async (req, res) => {
    const fuelLogs = await fuelService.getFuelLogs(req.user, req.query);
    return sendSuccess(res, 200, 'Fuel logs retrieved successfully', fuelLogs);
  });

  createFuelLog = asyncHandler(async (req, res) => {
    const log = await fuelService.createFuelLog(req.user, req.body);
    return sendSuccess(res, 201, 'Refueling ticket logged', log);
  });

  updateFuelLog = asyncHandler(async (req, res) => {
    const log = await fuelService.updateFuelLog(req.user, req.params.id, req.body);
    return sendSuccess(res, 200, 'Fuel entry updated', log);
  });

  deleteFuelLog = asyncHandler(async (req, res) => {
    await fuelService.deleteFuelLog(req.user, req.params.id);
    return sendSuccess(res, 200, 'Fuel entry deleted', null);
  });
}

module.exports = new FuelController();
