const express = require('express');
const clientController = require('../controllers/client.controller');
const validate = require('../middleware/validate.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { createClientSchema, updateClientSchema } = require('../validators/client.validator');

const router = express.Router();

router.use(requireAuth);

router.get('/', clientController.getClients);
router.get('/:id', clientController.getClientById);

// Admin-only mutations
router.post('/', restrictTo('PLATFORM_OPERATIONS_MANAGER'), validate(createClientSchema), clientController.createClient);
router.put('/:id', restrictTo('PLATFORM_OPERATIONS_MANAGER'), validate(updateClientSchema), clientController.updateClient);
router.delete('/:id', restrictTo('PLATFORM_OPERATIONS_MANAGER'), clientController.deleteClient);

module.exports = router;
