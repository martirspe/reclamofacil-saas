const crypto = require('crypto');
const { getClient } = require('../config/redis');
const sendEmail = require('../services/emailService');
const logger = require('./logger');

/**
 * Email verification utilities
 * Handles verification code generation, storage, and validation using Redis
 */

const VERIFICATION_CODE_LENGTH = 6;
const VERIFICATION_CODE_EXPIRY = parseInt(process.env.EMAIL_VERIFICATION_EXPIRY || '86400', 10); // 24 hours
const VERIFICATION_RATE_LIMIT = parseInt(process.env.EMAIL_VERIFICATION_RATE_LIMIT || '10', 10); // Max 10 per hour

/**
 * Generate a random numeric verification code
 * @returns {string} 6-digit verification code
 */
const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Store verification code in Redis with expiry
 * @param {number} userId - User ID
 * @param {string} code - Verification code
 * @returns {Promise<void>}
 */
const storeVerificationCode = async (userId, code) => {
  try {
    const redis = await getClient();
    const key = `email_verification:${userId}`;
    await redis.setEx(key, VERIFICATION_CODE_EXPIRY, code);
    logger.debug(`Verification code stored for user: ${userId}`);
  } catch (err) {
    logger.error('Error storing verification code', { userId, error: err.message });
    throw err;
  }
};

/**
 * Verify code for a user and delete it after successful verification
 * @param {number} userId - User ID
 * @param {string} code - Code to verify
 * @returns {Promise<boolean>} true if code is valid, false otherwise
 */
const verifyCode = async (userId, code) => {
  try {
    const redis = await getClient();
    const key = `email_verification:${userId}`;
    const storedCode = await redis.get(key);
    
    if (!storedCode || storedCode !== code) {
      logger.warn(`Invalid verification code attempt for user: ${userId}`);
      return false;
    }
    
    // Delete code after successful verification
    await redis.del(key);
    logger.info(`Email verified for user: ${userId}`);
    return true;
  } catch (err) {
    logger.error('Error verifying code', { userId, error: err.message });
    return false;
  }
};

/**
 * Send verification email to user
 * @param {Object} user - User object (id, email, first_name, last_name)
 * @param {Object} tenant - Tenant object (for email templates)
 * @param {string} code - Verification code
 * @param {string} baseUrl - Base URL for verification link
 * @returns {Promise<void>}
 */
const sendVerificationEmail = async (user, tenant, code, baseUrl) => {
  try {
    const verificationUrl = `${baseUrl}/verify-email?code=${code}&userId=${user.id}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Verifica tu correo electrónico',
      text: `Tu código de verificación es: ${code}. También puedes verificar tu correo en: ${verificationUrl}`,
      templateName: 'emailVerification',
      templateType: 'customer',
      tenant,
      replacements: {
        userName: `${user.first_name} ${user.last_name}`,
        verificationCode: code,
        verificationUrl
      }
    });
    
    logger.info(`Verification email sent to: ${user.email}`);
  } catch (err) {
    logger.error('Error sending verification email', { 
      userId: user.id, 
      email: user.email,
      error: err.message 
    });
    throw err;
  }
};

/**
 * Rate limit verification attempts per IP address
 * Prevents brute force attacks on verification endpoint
 * @param {string} ip - IP address
 * @returns {Promise<boolean>} true if allowed, false if rate limited
 */
const checkVerificationRateLimit = async (ip) => {
  try {
    const redis = await getClient();
    const key = `email_verify_rl:${ip}`;
    const count = await redis.incr(key);
    
    if (count === 1) {
      await redis.expire(key, 3600); // 1 hour window
    }
    
    const allowed = count <= VERIFICATION_RATE_LIMIT;
    
    if (!allowed) {
      logger.warn(`Verification rate limit exceeded for IP: ${ip}`, { 
        attempts: count,
        limit: VERIFICATION_RATE_LIMIT
      });
    }
    
    return allowed;
  } catch (err) {
    logger.error('Error checking verification rate limit', { ip, error: err.message });
    // Fail-open: allow if Redis unavailable
    return true;
  }
};

module.exports = {
  generateVerificationCode,
  storeVerificationCode,
  verifyCode,
  sendVerificationEmail,
  checkVerificationRateLimit,
  VERIFICATION_CODE_LENGTH,
  VERIFICATION_CODE_EXPIRY,
  VERIFICATION_RATE_LIMIT
};
