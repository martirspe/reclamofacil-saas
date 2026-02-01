const { getClient, isConnected } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Cache middleware with Redis integration
 * Caches GET responses based on URL and tenant for specified TTL
 * Fails open if Redis is unavailable to avoid blocking traffic
 * @param {number} ttl - Cache TTL in seconds (default: 300)
 * @returns {Function} Express middleware
 */
const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    try {
      // Skip cache for non-GET requests or if Redis unavailable
      if (req.method !== 'GET') {
        return next();
      }

      const isRedisAvailable = await isConnected();
      if (!isRedisAvailable) {
        logger.debug('Cache skipped: Redis not available');
        return next();
      }

      const redisClient = await getClient();
      const tenantSlug = (req.tenant?.slug || req.header('x-tenant') || req.header('x-tenant-slug') || 'public').toString().toLowerCase();
      
      // Create cache key based on full URL and query params
      const cacheKey = `cache:${tenantSlug}:${req.originalUrl || req.url}`;
      
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          logger.debug(`Cache hit for ${cacheKey}`);
          return res.status(200).json(JSON.parse(cachedData));
        }
      } catch (cacheReadErr) {
        logger.debug('Cache read failed, continuing', { error: cacheReadErr.message });
        // Continue to next middleware if cache read fails
      }
      
      // Intercept res.json to save response in cache
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode === 200) {
          // Attempt to cache response asynchronously
          redisClient
            .setEx(cacheKey, ttl, JSON.stringify(body))
            .catch(err => {
              logger.debug('Error saving to cache:', { error: err.message, key: cacheKey });
            });
        }
        return originalJson(body);
      };
      
      next();
    } catch (err) {
      logger.warn('Cache middleware error, skipping cache', { error: err.message });
      // Fail-open: continue without cache on unexpected errors
      next();
    }
  };
};

module.exports = cacheMiddleware;