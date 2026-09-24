const express = require('express');
const maintenanceController = require('../controllers/maintenance.controller');
const validate = require('../middleware/validate.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { createMaintenanceLogSchema, updateMaintenanceStatusSchema } = require('../validators/maintenance.validator');

const router = express.Router();

router.use(requireAuth);

router.get('/', maintenanceController.getMaintenanceLogs);
router.post('/', restrictTo('PLATFORM_OPERATIONS_MANAGER', 'FLEET_MANAGER'), validate(createMaintenanceLogSchema), maintenanceController.createMaintenanceLog);
router.patch('/:id/status', restrictTo('PLATFORM_OPERATIONS_MANAGER', 'FLEET_MANAGER'), validate(updateMaintenanceStatusSchema), maintenanceController.updateMaintenanceStatus);
router.put('/:id', restrictTo('PLATFORM_OPERATIONS_MANAGER', 'FLEET_MANAGER'), maintenanceController.updateMaintenanceLog);
router.delete('/:id', restrictTo('PLATFORM_OPERATIONS_MANAGER', 'FLEET_MANAGER'), maintenanceController.deleteMaintenanceLog);

module.exports = router;
