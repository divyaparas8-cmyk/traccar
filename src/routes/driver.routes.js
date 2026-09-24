const express = require('express');
const driverController = require('../controllers/driver.controller');
const validate = require('../middleware/validate.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { createDriverSchema, updateDriverSchema, assignVehicleSchema } = require('../validators/driver.validator');

const router = express.Router();

router.use(requireAuth);

router.get('/', driverController.getDrivers);
router.get('/:id', driverController.getDriverById);

router.post('/', restrictTo('PLATFORM_OPERATIONS_MANAGER', 'FLEET_MANAGER'), validate(createDriverSchema), driverController.createDriver);
router.put('/:id', restrictTo('PLATFORM_OPERATIONS_MANAGER', 'FLEET_MANAGER'), validate(updateDriverSchema), driverController.updateDriver);
router.delete('/:id', restrictTo('PLATFORM_OPERATIONS_MANAGER', 'FLEET_MANAGER'), driverController.deleteDriver);
router.post('/:id/assign-vehicle', restrictTo('PLATFORM_OPERATIONS_MANAGER', 'FLEET_MANAGER'), validate(assignVehicleSchema), driverController.assignVehicle);

module.exports = router;
