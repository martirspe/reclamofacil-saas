const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const secret = process.env.JWT_SECRET || 'your_super_secret_key';
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key';

/**
 * Generates both access and refresh tokens
 * - Access token: 1 hour expiration (short-lived)
 * - Refresh token: 7 days expiration (long-lived)
 */
const generateTokenPair = (user, tenantSlug = null) => {
  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      tenant_slug: tenantSlug,
      type: 'access'
    },
    secret,
    { expiresIn: '1h' } // Short expiration for security
  );

  const refreshToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      type: 'refresh'
    },
    refreshSecret,
    { expiresIn: '7d' } // Longer expiration for convenience
  );

  return { accessToken, refreshToken };
};

/**
 * Verifies access token
 */
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, secret);
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error(`Invalid access token: ${error.message}`);
  }
};

/**
 * Verifies refresh token
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, refreshSecret);
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error(`Invalid refresh token: ${error.message}`);
  }
};

/**
 * Checks if access token is expiring soon (within 5 minutes)
 */
const isTokenExpiringSoon = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return true;
    
    const expiresIn = (decoded.exp * 1000) - Date.now();
    return expiresIn < 5 * 60 * 1000; // Less than 5 minutes
  } catch (error) {
    return true;
  }
};

module.exports = {
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  isTokenExpiringSoon
};
