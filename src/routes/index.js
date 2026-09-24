const express = require('express');

const authRoutes = require('./auth.routes');
const clientRoutes = require('./client.routes');
const vehicleRoutes = require('./vehicle.routes');
const driverRoutes = require('./driver.routes');
const fuelRoutes = require('./fuel.routes');
const maintenanceRoutes = require('./maintenance.routes');
const insuranceRoutes = require('./insurance.routes');
const keuringRoutes = require('./keuring.routes');
const documentRoutes = require('./document.routes');
const telematicsRoutes = require('./telematics.routes');
const dashboardRoutes = require('./dashboard.routes');
const reportRoutes = require('./report.routes');
const exportRoutes = require('./export.routes');
const profileRoutes = require('./profile.routes');
const notificationRoutes = require('./notification.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/clients', clientRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/drivers', driverRoutes);
router.use('/fuel-logs', fuelRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/insurance', insuranceRoutes);
router.use('/keuring', keuringRoutes);
router.use('/documents', documentRoutes);
router.use('/telematics', telematicsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/exports', exportRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
