// Load environment variables from a .env file
require('dotenv').config();

// Import Express and connectDB function from database configuration file
const express = require('express');
const { connectDB } = require('./config/db');

// Import CORS Policy
const cors = require('cors');

// Import the main routes file
const routes = require('./routes/index');

// Import middleware for error handling
const { errorMiddleware } = require('./middlewares');

// Connect to the database at application startup
connectDB();

// Connect to Redis at startup (idempotent)
(async () => {
  try {
    const { connectOnce } = require('./config/redis');
    await connectOnce();
  } catch (err) {
    console.error('Redis startup error:', err?.message || err);
  }
})();

// Create an instance of the Express application
const app = express();

// Trust proxy so req.protocol respects X-Forwarded-Proto in hosting/proxies
app.set('trust proxy', true);

// List of allowed domains (fallback for specific origins)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);

// Security & logging
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const logger = require('./utils/logger');

// Custom CORS configuration with dynamic subdomain support
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g., mobile apps, REST clients, Postman)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in the explicit allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Development: Allow localhost on any port
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // Development: Allow .local domains with any subdomain (for local testing)
    // Supports multi-level subdomains and optional port
    const localPattern = /^https?:\/\/([a-zA-Z0-9-]+\.)*reclamofacil\.local(:\d+)?$/;
    if (localPattern.test(origin)) {
      return callback(null, true);
    }

    // Production: Allow HTTPS subdomains of reclamofacil.com only (security enforcement)
    // Examples: empresa.reclamofacil.com, api.empresa.reclamofacil.com, www.reclamofacil.com
    // HTTPS only - HTTP not allowed in production
    const productionPattern = /^https:\/\/([a-zA-Z0-9-]+\.)+reclamofacil\.com(:\d+)?$/;
    if (productionPattern.test(origin)) {
      return callback(null, true);
    }

    // Production: Allow main domain with HTTPS only (with or without www)
    if (origin === 'https://reclamofacil.com') {
      return callback(null, true);
    }

    // Deny all other origins
    callback(new Error('CORS bloqueado: Dominio no permitido.'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'x-tenant', 'x-tenant-slug', 'x-api-key'],
  credentials: true,
};

// Apply security headers and request logging (dev)
// Allow cross-origin loading of static assets like images (needed for client at :4200)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "www.google.com/recaptcha/", "www.gstatic.com/recaptcha/"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      frameSrc: ["'self'", "https://www.google.com/recaptcha/", "https://recaptcha.google.com/recaptcha/"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
}));
// HTTP request logging
app.use(pinoHttp({ logger }));

// Apply CORS with restrictive settings
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middleware to parse the body of requests as JSON with size limit
// Prevents DoS attacks with large payloads
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// Ensure upload folders exist on startup (useful in hosting environments)
const fs = require('fs');
const path = require('path');
['uploads/logos', 'uploads/claims', 'logs', 'assets/default-tenant'].forEach((dir) => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created directory: ${fullPath}`);
  }
});

// Serve uploads directory (user-uploaded logos, claim attachments, etc.)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Serve default branding assets (read-only)
app.use('/assets', express.static(path.join(__dirname, '..', 'assets'), {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Routes: use the routes defined in the routes/index.js file
app.use('/', routes);

// Health endpoint
app.get('/health', async (req, res) => {
  const health = { server: true };
  // DB check via Sequelize
  try {
    await require('./config/db').sequelize.authenticate();
    health.database = true;
  } catch (e) {
    health.database = false;
  }
  // Redis check
  try {
    const { getClient } = require('./config/redis');
    const client = await getClient();
    await client.ping();
    health.redis = true;
  } catch (e) {
    health.redis = false;
  }
  res.status(health.database && health.redis ? 200 : 503).json(health);
});

// Handle 404 errors: respond with a JSON message if the requested path is not found
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Middleware for error handling
app.use(errorMiddleware);

// Initialize Summary Job Scheduler
try {
  const claimSummaryJob = require('./jobs/claimSummaryJob');
  claimSummaryJob.initializeScheduler();
  console.log('✓ Summary job scheduler initialized');
} catch (error) {
  console.error('⚠ Failed to initialize summary job scheduler:', error.message);
  // Don't crash the server if scheduler fails to initialize
}

// Start the Express server on the port defined in the environment variables or on port 3000 by default
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});

// ============================================================================
// Graceful Shutdown Handlers
// ============================================================================
// Ensures proper cleanup of connections when process terminates

const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

  // Stop accepting new requests
  server.close(async () => {
    console.log('HTTP server closed');

    try {
      // Close Redis connection
      const { disconnect } = require('./config/redis');
      await disconnect();

      // Close database connection
      const { sequelize } = require('./config/db');
      await sequelize.close();
      console.log('Database connection closed');

      console.log('Graceful shutdown completed');
      process.exit(0);
    } catch (err) {
      console.error('Error during graceful shutdown:', err);
      process.exit(1);
    }
  });

  // Force shutdown if graceful takes too long (30 seconds)
  setTimeout(() => {
    console.error('Graceful shutdown timeout. Force closing...');
    process.exit(1);
  }, 30000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});
