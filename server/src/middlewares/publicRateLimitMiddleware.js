const { getClient, isConnected } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Rate limiter for public endpoints (signup, login, etc)
 * Protects against brute force attacks and bot abuse
 * Uses fixed-window strategy with Redis
 * Fails open if Redis unavailable to avoid blocking legitimate users
 * @param {Object} options - Configuration options
 * @param {number} options.windowSeconds - Time window in seconds (default: 900 = 15 min)
 * @param {number} options.maxRequests - Max requests per window (default: 5)
 * @param {string} options.keyPrefix - Redis key prefix (default: 'public_rl')
 * @returns {Function} Express middleware
 */
const publicRateLimit = (options = {}) => {
  const {
    windowSeconds = 900,    // 15 minutes
    maxRequests = 5,        // 5 attempts per window
    keyPrefix = 'public_rl' // Redis key prefix
  } = options;

  /**
   * Validate configuration
   */
  if (windowSeconds <= 0 || maxRequests <= 0) {
    throw new Error('Invalid rate limit configuration: windowSeconds and maxRequests must be > 0');
  }

  /**
   * Middleware function
   */
  return async (req, res, next) => {
    try {
      // Check if Redis is available
      const isRedisAvailable = await isConnected();
      if (!isRedisAvailable) {
        logger.warn('Public rate limit skipped: Redis unavailable');
        return next(); // Fail-open
      }

      const redis = await getClient();
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const key = `${keyPrefix}:${ip}`;

      // Increment counter and set window if first request
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      // Get remaining TTL
      const ttl = await redis.ttl(key);
      const remaining = Math.max(maxRequests - count, 0);

      // Set RFC 6585 compliant rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.max(ttl, 0));

      // Block if limit exceeded
      if (count > maxRequests) {
        res.setHeader('Retry-After', Math.max(ttl, 0));
        logger.warn(`Public rate limit exceeded for IP:${ip}`, {
          count,
          limit: maxRequests,
          endpoint: req.path
        });

        return res.status(429).json({
          message: 'Demasiados intentos desde esta IP. Intenta nuevamente más tarde.',
          retryAfter: Math.max(ttl, 0),
          resetAt: new Date(Date.now() + Math.max(ttl, 0) * 1000).toISOString()
        });
      }

      next();
    } catch (err) {
      // Fail-open on Redis errors to avoid blocking legitimate traffic
      logger.warn('Public rate limit middleware error, skipping rate limit', {
        error: err.message,
        code: err.code,
        endpoint: req.path
      });
      next();
    }
  };
};

module.exports = publicRateLimit;
