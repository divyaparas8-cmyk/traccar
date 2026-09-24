const express = require('express');
const multer = require('multer');
const documentController = require('../controllers/document.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB max
});

const router = express.Router();

router.use(requireAuth);

router.get('/', documentController.getDocuments);
router.post('/upload', restrictTo('PLATFORM_OPERATIONS_MANAGER', 'FLEET_MANAGER'), upload.single('file'), documentController.uploadDocument);
router.delete('/:id', restrictTo('PLATFORM_OPERATIONS_MANAGER', 'FLEET_MANAGER'), documentController.deleteDocument);

module.exports = router;
