const express = require('express');
const { publicSignup, publicLogin, verifyEmail, resendVerification, refreshAccessToken, forgotPassword, resetPassword } = require('../controllers/authController');
const recaptchaMiddleware = require('../middlewares/recaptchaMiddleware');
const publicRateLimit = require('../middlewares/publicRateLimitMiddleware');

const router = express.Router();

// Rate limit config: Strict limits to prevent brute force attacks
const signupRateLimit = publicRateLimit({ maxRequests: 5, windowSeconds: 900, keyPrefix: 'signup_rl' });
const loginRateLimit = publicRateLimit({ maxRequests: 5, windowSeconds: 900, keyPrefix: 'login_rl' }); // 5 attempts per 15 min
const refreshRateLimit = publicRateLimit({ maxRequests: 10, windowSeconds: 900, keyPrefix: 'refresh_rl' }); // 10 attempts per 15 min
const forgotRateLimit = publicRateLimit({ maxRequests: 5, windowSeconds: 900, keyPrefix: 'forgot_rl' });
const resetRateLimit = publicRateLimit({ maxRequests: 10, windowSeconds: 900, keyPrefix: 'reset_rl' });

// Public signup: creates tenant + admin user (rate limited, no reCAPTCHA)
router.post('/public/signup', signupRateLimit, publicSignup);

// Public login: rate limited, no reCAPTCHA (better UX, still secure)
router.post('/public/login', loginRateLimit, publicLogin);

// Public refresh token endpoint: exchange refresh token for new access token
router.post('/public/refresh', refreshRateLimit, refreshAccessToken);

// Email verification endpoint
router.post('/public/verify-email', verifyEmail);

// Resend verification email
router.post('/public/resend-verification', resendVerification);

// Forgot password
router.post('/public/forgot-password', forgotRateLimit, forgotPassword);

// Reset password
router.post('/public/reset-password', resetRateLimit, resetPassword);

module.exports = router;
