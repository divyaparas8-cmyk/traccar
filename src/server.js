const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const prisma = require('./config/database');

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`FleetFlow FMS Backend Server running in ${env.NODE_ENV} mode on port ${PORT}`);
});

// Graceful Shutdown Handler
const shutdown = async () => {
  logger.info('Shutting down server gracefully...');
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Database disconnected.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Unhandled Rejection caught:');
});
