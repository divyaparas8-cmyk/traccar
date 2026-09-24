const express = require('express');
const telematicsController = require('../controllers/telematics.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/live', telematicsController.getLivePositions);
router.get('/route-history', telematicsController.getRouteHistory);

module.exports = router;
