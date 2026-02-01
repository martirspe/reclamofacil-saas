const { getClient, isConnected } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Rate limiter per tenant + IP address
 * Prevents abuse of authenticated, tenant-scoped routes
 * Uses fixed-window strategy with Redis
 * Fails open if Redis unavailable to avoid blocking legitimate traffic
 */
const WINDOW_SECONDS = parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '900', 10); // 15 min
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX || '300', 10);

/**
 * Extract tenant slug from request
 * Checks: req.tenant.slug > headers > hostname > default to 'public'
 * @param {Object} req - Express request object
 * @returns {string} Tenant slug
 */
const getTenantSlug = (req) => {
  const fromTenant = req.tenant?.slug;
  const fromHeader = req.header('x-tenant') || req.header('x-tenant-slug');
  
  if (fromTenant) return String(fromTenant).toLowerCase();
  if (fromHeader) return String(fromHeader).toLowerCase();
  
  const host = req.get('host');
  if (host) {
    const hostname = host.split(':')[0];
    const parts = hostname.split('.');
    if (parts.length >= 3 && parts[0].toLowerCase() !== 'www') {
      return parts[0].toLowerCase();
    }
  }
  
  return 'public';
};

/**
 * Tenant + IP based rate limiter middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const rateLimitTenant = async (req, res, next) => {
  try {
    // Master plan bypasses rate limits
    if (req.tenant?.subscription?.plan_name === 'master') {
      logger.debug('Rate limit bypassed: master plan');
      return next();
    }

    // Check if Redis is available
    const isRedisAvailable = await isConnected();
    if (!isRedisAvailable) {
      logger.warn('Rate limit skipped: Redis unavailable');
      return next(); // Fail-open
    }

    const redis = await getClient();
    const tenantSlug = getTenantSlug(req);
    const key = `rl:${tenantSlug}:${req.ip}`;

    // Increment request count and set window if first request
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }

    // Get remaining TTL for response headers
    const ttl = await redis.ttl(key);
    const remaining = Math.max(MAX_REQUESTS - count, 0);

    // Set rate limit headers (RFC 6585 compliant)
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.max(ttl, 0));

    // Block if exceeded
    if (count > MAX_REQUESTS) {
      res.setHeader('Retry-After', Math.max(ttl, 0));
      logger.warn(`Rate limit exceeded for tenant:${tenantSlug} ip:${req.ip}`, {
        count,
        limit: MAX_REQUESTS
      });
      
      return res.status(429).json({
        message: 'Límite de peticiones alcanzado para este tenant. Intenta nuevamente más tarde.',
        retryAfter: Math.max(ttl, 0)
      });
    }

    next();
  } catch (err) {
    // Fail-open on Redis errors to avoid blocking traffic
    logger.warn('Rate limit middleware error, skipping rate limit', {
      error: err.message,
      code: err.code
    });
    next();
  }
};

module.exports = rateLimitTenant;
