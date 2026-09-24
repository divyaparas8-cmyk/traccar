const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const env = require('./config/env');
const apiRouter = require('./routes');
const notFoundHandler = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/error.middleware');
const { apiRateLimiter } = require('./middleware/rateLimit.middleware');

const app = express();

// 1. Security HTTP Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 2. CORS Setup
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    return callback(new Error('CORS Policy restriction'));
  },
  credentials: true
}));

// 3. Rate Limiting
app.use('/api', apiRateLimiter);

// 4. Request Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 5. Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Static Uploads Folder
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR || './uploads')));

// 7. Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    system: 'FleetFlow FMS Backend API',
    timestamp: new Date().toISOString()
  });
});

// 8. API v1 Routes Mounting
app.use('/api/v1', apiRouter);

// 9. 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
