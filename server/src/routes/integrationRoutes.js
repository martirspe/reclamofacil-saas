const express = require('express');
const { apiKeyMiddleware, requireApiKeyScope, rateLimitTenant, auditMiddleware } = require('../middlewares');
const { uploadClaim } = require('../middlewares/uploadMiddleware');
const { createClaim, getClaims, getClaimById } = require('../controllers/claimController');

const router = express.Router();

// Create claim via API key (supports multipart attachments)
router.post(
  '/integrations/:slug/claims',
  apiKeyMiddleware,
  requireApiKeyScope('claims:write'),
  rateLimitTenant,
  auditMiddleware('integration:claim:create'),
  uploadClaim,
  createClaim
);

// List claims via API key (requires scope claims:read)
router.get('/integrations/:slug/claims', apiKeyMiddleware, requireApiKeyScope('claims:read'), rateLimitTenant, auditMiddleware('integration:claim:list'), getClaims);

// Get claim by id via API key (requires scope claims:read)
router.get('/integrations/:slug/claims/:id', apiKeyMiddleware, requireApiKeyScope('claims:read'), rateLimitTenant, auditMiddleware('integration:claim:get'), getClaimById);

module.exports = router;
