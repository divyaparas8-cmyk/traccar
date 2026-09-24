const maintenanceService = require('../services/maintenance.service');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

class MaintenanceController {
  getMaintenanceLogs = asyncHandler(async (req, res) => {
    const logs = await maintenanceService.getMaintenanceLogs(req.user, req.query);
    return sendSuccess(res, 200, 'Maintenance logs retrieved successfully', logs);
  });

  createMaintenanceLog = asyncHandler(async (req, res) => {
    const log = await maintenanceService.createMaintenanceLog(req.user, req.body);
    return sendSuccess(res, 201, `Scheduled ${log.serviceType}`, log);
  });

  updateMaintenanceStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const log = await maintenanceService.updateMaintenanceStatus(req.user, req.params.id, status);
    return sendSuccess(res, 200, `Service status updated to ${status.replace('_', ' ')}`, log);
  });

  updateMaintenanceLog = asyncHandler(async (req, res) => {
    const log = await maintenanceService.updateMaintenanceLog(req.user, req.params.id, req.body);
    return sendSuccess(res, 200, 'Maintenance log updated', log);
  });

  deleteMaintenanceLog = asyncHandler(async (req, res) => {
    await maintenanceService.deleteMaintenanceLog(req.user, req.params.id);
    return sendSuccess(res, 200, 'Maintenance entry removed', null);
  });
}

module.exports = new MaintenanceController();
