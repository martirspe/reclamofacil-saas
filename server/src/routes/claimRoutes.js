const express = require('express');

// Upload middleware
const { uploadClaim, uploadResolveClaim } = require('../middlewares/uploadMiddleware');
// Optional reCAPTCHA middleware
const recaptchaMiddleware = require('../middlewares/recaptchaMiddleware');
const { validateClaimCreate, validateClaimUpdate, validateClaimAssign, validateClaimResolve } = require('../middlewares/validationMiddleware');
const { authMiddleware, tenantMiddleware, membershipMiddleware, requireTenantRole, rateLimitTenant, auditMiddleware, apiKeyOrJwt, requireApiKeyScopeOrJwt, limitResourceCreation } = require('../middlewares');

// Claims controller
const {
  createClaim,
  getClaims,
  getClaimById,
  updateClaim,
  deleteClaim,
  assignClaim,
  resolveClaim
} = require('../controllers/claimController');

const router = express.Router();

// Create a new claim (tenant + auth protected). Multipart first to populate req.body
// Priority 2: Audit middleware logs claim creation
// Priority 3: Resource limit checks free tier quota (max 10 claims)
router.post('/tenants/:slug/claims', 
  apiKeyOrJwt, 
  requireApiKeyScopeOrJwt('claims:write'), 
  rateLimitTenant, 
  limitResourceCreation('maxClaims', 'Claim'),
  auditMiddleware('CREATE', 'Claim'), 
  uploadClaim, 
  validateClaimCreate, 
  recaptchaMiddleware, 
  createClaim
);

// Get all claims for tenant
router.get('/tenants/:slug/claims', apiKeyOrJwt, requireApiKeyScopeOrJwt('claims:read'), rateLimitTenant, getClaims);

// Get a claim by ID (tenant scoped)
router.get('/tenants/:slug/claims/:id', apiKeyOrJwt, requireApiKeyScopeOrJwt('claims:read'), rateLimitTenant, getClaimById);

// Update a claim
// Priority 2: Audit middleware logs claim modifications
router.put('/tenants/:slug/claims/:id', 
  apiKeyOrJwt, 
  requireApiKeyScopeOrJwt('claims:write'), 
  rateLimitTenant, 
  requireTenantRole('admin', 'staff'), 
  auditMiddleware('UPDATE', 'Claim'), 
  validateClaimUpdate, 
  uploadClaim, 
  updateClaim
);

// Delete a claim
// Priority 2: Audit middleware logs claim deletion
router.delete('/tenants/:slug/claims/:id', 
  apiKeyOrJwt, 
  requireApiKeyScopeOrJwt('claims:write'), 
  rateLimitTenant, 
  requireTenantRole('admin'), 
  auditMiddleware('DELETE', 'Claim'), 
  deleteClaim
);

// Assign a claim
// Priority 2: Audit middleware logs claim assignment
router.patch('/tenants/:slug/claims/:id/assign', 
  apiKeyOrJwt, 
  requireApiKeyScopeOrJwt('claims:write'), 
  rateLimitTenant, 
  requireTenantRole('admin', 'staff'), 
  auditMiddleware('UPDATE', 'Claim'), 
  validateClaimAssign, 
  assignClaim
);

// Resolve a claim (multipart parsing first to populate req.body)
// Priority 2: Audit middleware logs claim resolution
router.patch('/tenants/:slug/claims/:id/resolve', 
  apiKeyOrJwt, 
  requireApiKeyScopeOrJwt('claims:write'), 
  rateLimitTenant, 
  requireTenantRole('admin', 'staff'), 
  auditMiddleware('UPDATE', 'Claim'), 
  uploadResolveClaim, 
  validateClaimResolve, 
  resolveClaim
);

module.exports = router;
