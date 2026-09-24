const express = require('express');
const insuranceController = require('../controllers/insurance.controller');
const validate = require('../middleware/validate.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { updateInsuranceDateSchema } = require('../validators/insurance.validator');

const router = express.Router();

router.use(requireAuth);

router.get('/', insuranceController.getInsuranceOverview);
router.put('/:vehicleId/date', restrictTo('PLATFORM_OPERATIONS_MANAGER', 'FLEET_MANAGER'), validate(updateInsuranceDateSchema), insuranceController.updateInsuranceDate);
router.post('/:vehicleId/renew', restrictTo('PLATFORM_OPERATIONS_MANAGER', 'FLEET_MANAGER'), insuranceController.renewInsurance);

module.exports = router;
