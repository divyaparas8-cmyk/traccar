const express = require('express');
const vehicleController = require('../controllers/vehicle.controller');
const validate = require('../middleware/validate.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { createVehicleSchema, updateVehicleSchema } = require('../validators/vehicle.validator');

const router = express.Router();

router.use(requireAuth);

router.get('/', vehicleController.getVehicles);
router.get('/:id', vehicleController.getVehicleById);

router.post('/', restrictTo('PLATFORM_OPERATIONS_MANAGER', 'FLEET_MANAGER'), validate(createVehicleSchema), vehicleController.createVehicle);
router.put('/:id', restrictTo('PLATFORM_OPERATIONS_MANAGER', 'FLEET_MANAGER'), validate(updateVehicleSchema), vehicleController.updateVehicle);
router.delete('/:id', restrictTo('PLATFORM_OPERATIONS_MANAGER', 'FLEET_MANAGER'), vehicleController.deleteVehicle);

module.exports = router;
