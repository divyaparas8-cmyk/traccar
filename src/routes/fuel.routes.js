const express = require('express');
const fuelController = require('../controllers/fuel.controller');
const validate = require('../middleware/validate.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { createFuelLogSchema, updateFuelLogSchema } = require('../validators/fuel.validator');

const router = express.Router();

router.use(requireAuth);

router.get('/', fuelController.getFuelLogs);
router.post('/', validate(createFuelLogSchema), fuelController.createFuelLog);
router.put('/:id', validate(updateFuelLogSchema), fuelController.updateFuelLog);
router.delete('/:id', restrictTo('PLATFORM_OPERATIONS_MANAGER', 'FLEET_MANAGER'), fuelController.deleteFuelLog);

module.exports = router;
