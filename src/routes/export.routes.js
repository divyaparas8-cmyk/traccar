const express = require('express');
const reportController = require('../controllers/report.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(requireAuth);

router.post('/download', reportController.generateExport);

module.exports = router;
