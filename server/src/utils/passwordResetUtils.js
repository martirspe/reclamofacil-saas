const crypto = require('crypto');
const { getClient } = require('../config/redis');
const sendEmail = require('../services/emailService');
const logger = require('./logger');

const RESET_TOKEN_BYTES = parseInt(process.env.PASSWORD_RESET_TOKEN_BYTES || '32', 10);
const PASSWORD_RESET_EXPIRY = parseInt(process.env.PASSWORD_RESET_EXPIRY || '3600', 10); // 1 hour

const generateResetToken = () => crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const storeResetToken = async (userId, token) => {
  try {
    const redis = await getClient();
    const key = `password_reset:${userId}`;
    const hashedToken = hashToken(token);
    await redis.setEx(key, PASSWORD_RESET_EXPIRY, hashedToken);
    logger.info(`Reset token stored for userId: ${userId}, expiry: ${PASSWORD_RESET_EXPIRY}s`);
  } catch (err) {
    logger.error('Error storing reset token in Redis', { userId, error: err.message });
    throw err;
  }
};

const verifyResetToken = async (userId, token) => {
  try {
    const redis = await getClient();
    const key = `password_reset:${userId}`;
    const stored = await redis.get(key);
    if (!stored) {
      logger.warn(`Reset token not found or expired for userId: ${userId}`);
      return false;
    }
    const hashedToken = hashToken(token);
    const matches = stored === hashedToken;
    if (!matches) {
      logger.warn(`Reset token mismatch for userId: ${userId}`);
      return false;
    }
    await redis.del(key);
    logger.info(`Reset token verified and deleted for userId: ${userId}`);
    return true;
  } catch (err) {
    logger.error('Error verifying reset token', { userId, error: err.message });
    throw err;
  }
};

const sendPasswordResetEmail = async (user, tenant, resetUrl) => {
  const expiryMinutes = Math.ceil(PASSWORD_RESET_EXPIRY / 60);
  await sendEmail({
    to: user.email,
    subject: 'Restablece tu contraseña',
    text: `Usa este enlace para restablecer tu contraseña: ${resetUrl}`,
    templateName: 'passwordReset',
    templateType: 'customer',
    tenant,
    replacements: {
      userName: `${user.first_name} ${user.last_name}`.trim(),
      resetUrl,
      expiryMinutes: String(expiryMinutes)
    }
  });
  logger.info(`Password reset email sent to: ${user.email}`);
};

module.exports = {
  generateResetToken,
  storeResetToken,
  verifyResetToken,
  sendPasswordResetEmail,
  PASSWORD_RESET_EXPIRY
};
