const jwt = require('jsonwebtoken');

// Set up your secret key securely
const secret = process.env.JWT_SECRET || 'your_super_secret_key';
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key';

/**
 * DEPRECATED: Use generateTokenPair from refreshTokenUtils.js instead
 * This function kept for backwards compatibility
 */
const generateJWT = (user, tenantSlug = null) => {
  const { generateTokenPair } = require('./refreshTokenUtils');
  const { accessToken } = generateTokenPair(user, tenantSlug);
  return accessToken;
};

/**
 * Verifies access token and returns payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Verifies refresh token and returns payload
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, refreshSecret);
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error(`Refresh token verification failed: ${error.message}`);
  }
};

module.exports = { generateJWT, verifyToken, verifyRefreshToken };
