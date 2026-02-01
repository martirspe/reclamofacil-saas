const express = require('express');

// Upload middleware
const { uploadClaim } = require('../middlewares/uploadMiddleware');
// reCAPTCHA middleware
const recaptchaMiddleware = require('../middlewares/recaptchaMiddleware');
const { validatePublicClaim } = require('../middlewares/validationMiddleware');
const { tenantMiddleware } = require('../middlewares');

// Public rate limit middleware (more restrictive for public endpoints)
const publicRateLimitMiddleware = require('../middlewares/publicRateLimitMiddleware');

// Claims controller (public)
const { createPublicClaim, getPublicClaimByCode } = require('../controllers/claimController');

const router = express.Router();

/**
 * PUBLIC ROUTE: Create claim from public complaint form
 * No authentication required - accessible via subdomain
 * Example: https://empresa.reclamofacil.com
 * 
 * Middleware chain:
 * 1. publicRateLimitMiddleware: Strict rate limit (e.g., 5 req/15min per IP)
 * 2. tenantMiddleware: Resolves tenant from slug/subdomain
 * 3. uploadClaim: Handles file upload
 * 4. validatePublicClaim: Validates public claim payload
 * 5. recaptchaMiddleware: Prevents bot submissions
 * 6. createPublicClaim: Controller to create claim + customer/tutor
 */
router.post('/public/:slug/claims', 
	publicRateLimitMiddleware(),
	tenantMiddleware,
	uploadClaim,
	validatePublicClaim,
	recaptchaMiddleware,
	createPublicClaim
);

/**
 * PUBLIC ROUTE: Get claim by code for tracking
 * No authentication required
 * Example code: REC-2026-000001 or QUE-2026-000001
 */
router.get('/public/:slug/claims/:code',
  publicRateLimitMiddleware(),
  tenantMiddleware,
  getPublicClaimByCode
);

module.exports = router;
