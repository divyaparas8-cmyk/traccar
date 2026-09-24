const express = require('express');
const keuringController = require('../controllers/keuring.controller');
const validate = require('../middleware/validate.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { createKeuringRecordSchema } = require('../validators/keuring.validator');

const router = express.Router();

router.use(requireAuth);

router.get('/', keuringController.getKeuringRecords);
router.post('/', restrictTo('PLATFORM_OPERATIONS_MANAGER', 'FLEET_MANAGER'), validate(createKeuringRecordSchema), keuringController.createKeuringRecord);
router.put('/:id', restrictTo('PLATFORM_OPERATIONS_MANAGER', 'FLEET_MANAGER'), keuringController.updateKeuringRecord);
router.delete('/:id', restrictTo('PLATFORM_OPERATIONS_MANAGER', 'FLEET_MANAGER'), keuringController.deleteKeuringRecord);

module.exports = router;
