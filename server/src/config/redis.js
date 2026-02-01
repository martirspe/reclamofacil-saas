const { createClient } = require('redis');
const logger = require('../utils/logger');

// ============================================================================
// Redis Configuration & Connection Management
// ============================================================================
// Follows lazy-loading + singleton pattern for robust connection handling
// Validates environment, handles reconnection, and prevents duplicate connects

/** @type {import('redis').RedisClient|null} */
let client = null;

/** @type {Promise|null} */
let connectPromise = null;

/** Configuration from environment */
const config = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  url: process.env.REDIS_URL,
  maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '10', 10),
  retryDelayMs: parseInt(process.env.REDIS_RETRY_DELAY_MS || '50', 10),
  connectTimeoutMs: parseInt(process.env.REDIS_CONNECT_TIMEOUT_MS || '10000', 10),
  socketTimeoutMs: parseInt(process.env.REDIS_SOCKET_TIMEOUT_MS || '30000', 10)
};

const redisUrl = config.url || `redis://${config.host}:${config.port}`;

/**
 * Creates a Redis client instance with proper configuration
 * Uses singleton pattern to ensure only one client exists
 * @returns {Promise<import('redis').RedisClient>} Redis client instance
 */
const getClient = async () => {
  if (client) {
    return client;
  }

  client = createClient({
    url: redisUrl,
    socket: {
      // Exponential backoff: 50ms, 100ms, 150ms... max 500ms
      reconnectStrategy: (retries) => {
        if (retries > config.maxRetries) {
          logger.error(
            `Redis reconnection failed after ${config.maxRetries} attempts. Giving up.`
          );
          return new Error('Max Redis reconnection attempts exceeded');
        }
        const delay = Math.min(retries * config.retryDelayMs, 500);
        logger.warn(`Redis reconnecting (attempt ${retries})... waiting ${delay}ms`);
        return delay;
      },
      connectTimeout: config.connectTimeoutMs,
      socketTimeout: config.socketTimeoutMs
    }
  });

  // Event handlers for monitoring
  client.on('error', (err) => {
    logger.error('Redis Client Error', { error: err.message, code: err.code });
  });

  client.on('connect', () => {
    logger.info('Connected to Redis');
  });

  client.on('ready', () => {
    logger.info('Redis client ready');
  });

  client.on('reconnecting', () => {
    logger.warn('Redis reconnecting...');
  });

  client.on('end', () => {
    logger.warn('Redis connection closed');
  });

  return client;
};

/**
 * Idempotent connection handler
 * Ensures Redis connects only once and reuses the promise for concurrent calls
 * @returns {Promise<import('redis').RedisClient>} Connected Redis client
 */
const connectOnce = async () => {
  // Return existing promise if already connecting
  if (connectPromise) {
    return connectPromise;
  }

  // Create new connection promise
  connectPromise = (async () => {
    try {
      const redisClient = await getClient();

      // Check if already connected to avoid redundant calls
      if (redisClient.isOpen || redisClient.isReady) {
        logger.debug('Redis already connected, skipping connect call');
        return redisClient;
      }

      logger.info('Initiating Redis connection...');
      await redisClient.connect();
      logger.info('Redis connection established successfully');
      return redisClient;
    } catch (err) {
      // Don't crash on "Socket already opened" - this can happen during rapid restarts
      if (err?.message?.includes('Socket already opened')) {
        logger.warn('Redis socket already in opening state (acceptable during startup)');
        return client;
      }

      logger.error('Failed to connect to Redis', {
        error: err.message,
        code: err.code,
        stack: err.stack
      });
      throw err;
    }
  })();

  return connectPromise;
};

/**
 * Graceful shutdown handler
 * Safely closes Redis connection
 * @returns {Promise<void>}
 */
const disconnect = async () => {
  if (client && (client.isOpen || client.isReady)) {
    try {
      logger.info('Closing Redis connection...');
      await client.quit();
      logger.info('Redis connection closed');
      client = null;
      connectPromise = null;
    } catch (err) {
      logger.error('Error closing Redis connection', { error: err.message });
    }
  }
};

/**
 * Health check for Redis connection
 * @returns {Promise<boolean>} true if connected, false otherwise
 */
const isConnected = async () => {
  if (!client) return false;
  try {
    await client.ping();
    return true;
  } catch (err) {
    logger.debug('Redis ping failed', { error: err.message });
    return false;
  }
};

module.exports = {
  getClient,
  connectOnce,
  disconnect,
  isConnected,
  config
};
