const driverService = require('../services/driver.service');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

class DriverController {
  getDrivers = asyncHandler(async (req, res) => {
    const drivers = await driverService.getDrivers(req.user, req.query);
    return sendSuccess(res, 200, 'Drivers retrieved successfully', drivers);
  });

  getDriverById = asyncHandler(async (req, res) => {
    const driver = await driverService.getDriverById(req.user, req.params.id);
    return sendSuccess(res, 200, 'Driver details retrieved', driver);
  });

  createDriver = asyncHandler(async (req, res) => {
    const driver = await driverService.createDriver(req.user, req.body);
    return sendSuccess(res, 201, `Driver profile created for ${driver.name}`, driver);
  });

  updateDriver = asyncHandler(async (req, res) => {
    const driver = await driverService.updateDriver(req.user, req.params.id, req.body);
    return sendSuccess(res, 200, 'Driver profile updated', driver);
  });

  deleteDriver = asyncHandler(async (req, res) => {
    await driverService.deleteDriver(req.user, req.params.id);
    return sendSuccess(res, 200, 'Driver profile removed', null);
  });

  assignVehicle = asyncHandler(async (req, res) => {
    await driverService.assignVehicle(req.user, req.params.id, req.body.vehicleId);
    return sendSuccess(res, 200, 'Driver vehicle allocation updated', null);
  });
}

module.exports = new DriverController();
