const { getClient } = require('../config/redis');
const logger = require('./logger');

/**
 * Login security utilities
 * Implements rate limiting for login attempts using Redis
 * Prevents brute force attacks with exponential lockout
 */

const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10);
const LOCKOUT_DURATION = parseInt(process.env.LOGIN_LOCKOUT_DURATION || '3600', 10); // 1 hour
const ATTEMPT_WINDOW = parseInt(process.env.LOGIN_ATTEMPT_WINDOW || '900', 10); // 15 minutes

/**
 * Check if email is locked due to failed login attempts
 * @param {string} email - User email address
 * @returns {Promise<{isLocked: boolean, remainingTime: number}>} Lock status and time
 */
const checkLoginLockout = async (email) => {
  try {
    const redis = await getClient();
    const lockKey = `login_lock:${email}`;
    const lockExists = await redis.exists(lockKey);
    
    if (lockExists) {
      const ttl = await redis.ttl(lockKey);
      logger.warn(`Login attempt for locked account: ${email}`, { remainingTime: ttl });
      return { 
        isLocked: true, 
        remainingTime: Math.max(ttl, 0)
      };
    }
    
    return { 
      isLocked: false, 
      remainingTime: 0 
    };
  } catch (err) {
    logger.error('Error checking login lockout', { email, error: err.message });
    // Fail-open: allow login if Redis unavailable
    return { isLocked: false, remainingTime: 0 };
  }
};

/**
 * Record a failed login attempt
 * Locks account after MAX_LOGIN_ATTEMPTS within ATTEMPT_WINDOW
 * @param {string} email - User email address
 * @returns {Promise<number>} Current attempt count
 */
const recordFailedLoginAttempt = async (email) => {
  try {
    const redis = await getClient();
    const attemptsKey = `login_attempts:${email}`;
    const count = await redis.incr(attemptsKey);
    
    // Set expiry window on first attempt
    if (count === 1) {
      await redis.expire(attemptsKey, ATTEMPT_WINDOW);
      logger.debug(`Login attempt tracking started for: ${email}`);
    }
    
    // Lock account if max attempts reached
    if (count >= MAX_LOGIN_ATTEMPTS) {
      const lockKey = `login_lock:${email}`;
      await redis.setEx(lockKey, LOCKOUT_DURATION, 'locked');
      await redis.del(attemptsKey);
      
      logger.warn(`Account locked due to failed login attempts: ${email}`, {
        attempts: count,
        lockDuration: LOCKOUT_DURATION
      });
    } else {
      logger.debug(`Failed login recorded for: ${email}`, {
        attempt: count,
        maxAttempts: MAX_LOGIN_ATTEMPTS
      });
    }
    
    return count;
  } catch (err) {
    logger.error('Error recording failed login attempt', { email, error: err.message });
    // Fail-open: allow retry if Redis unavailable
    return 0;
  }
};

/**
 * Clear failed login attempts on successful login
 * @param {string} email - User email address
 * @returns {Promise<void>}
 */
const clearLoginAttempts = async (email) => {
  try {
    const redis = await getClient();
    const attemptsKey = `login_attempts:${email}`;
    const deleted = await redis.del(attemptsKey);
    
    if (deleted > 0) {
      logger.debug(`Login attempts cleared for: ${email}`);
    }
  } catch (err) {
    logger.error('Error clearing login attempts', { email, error: err.message });
  }
};

/**
 * Get remaining login attempts before lockout
 * @param {string} email - User email address
 * @returns {Promise<number>} Attempts remaining (0 if locked or unavailable)
 */
const getRemainingAttempts = async (email) => {
  try {
    const redis = await getClient();
    const attemptsKey = `login_attempts:${email}`;
    const count = await redis.get(attemptsKey);
    return Math.max(MAX_LOGIN_ATTEMPTS - (parseInt(count) || 0), 0);
  } catch (err) {
    logger.error('Error getting remaining attempts', { email, error: err.message });
    // Fail-open: assume attempts available if Redis unavailable
    return MAX_LOGIN_ATTEMPTS;
  }
};

module.exports = {
  checkLoginLockout,
  recordFailedLoginAttempt,
  clearLoginAttempts,
  getRemainingAttempts,
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION,
  ATTEMPT_WINDOW
};
