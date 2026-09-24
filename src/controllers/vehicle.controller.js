const vehicleService = require('../services/vehicle.service');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

class VehicleController {
  getVehicles = asyncHandler(async (req, res) => {
    const vehicles = await vehicleService.getVehicles(req.user, req.query);
    return sendSuccess(res, 200, 'Vehicles retrieved successfully', vehicles);
  });

  getVehicleById = asyncHandler(async (req, res) => {
    const vehicle = await vehicleService.getVehicleById(req.user, req.params.id);
    return sendSuccess(res, 200, 'Vehicle details retrieved', vehicle);
  });

  createVehicle = asyncHandler(async (req, res) => {
    const vehicle = await vehicleService.createVehicle(req.user, req.body);
    return sendSuccess(res, 201, `${vehicle.name} added to fleet directory`, vehicle);
  });

  updateVehicle = asyncHandler(async (req, res) => {
    const vehicle = await vehicleService.updateVehicle(req.user, req.params.id, req.body);
    return sendSuccess(res, 200, `Vehicle specs for ${vehicle.name} updated`, vehicle);
  });

  deleteVehicle = asyncHandler(async (req, res) => {
    await vehicleService.deleteVehicle(req.user, req.params.id);
    return sendSuccess(res, 200, 'Vehicle removed from fleet', null);
  });
}

module.exports = new VehicleController();
