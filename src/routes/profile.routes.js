const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const { updateProfileSchema } = require('../validators/auth.validator');

const router = express.Router();

router.use(requireAuth);

router.put('/', validate(updateProfileSchema), authController.updateProfile);

module.exports = router;
