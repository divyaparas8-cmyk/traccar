const pino = require('pino');
const env = require('./env');

const logger = pino({
  level: env.LOG_LEVEL || 'info',
  transport: env.NODE_ENV === 'development' ? {
    target: 'pino/file',
    options: { destination: 1 } // stdout
  } : undefined
});

module.exports = logger;
