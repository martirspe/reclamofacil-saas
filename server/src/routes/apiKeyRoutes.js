/**
 * API Key routes: tenant-scoped API key management
 * Protected by admin role - only admins can manage API keys
 * Priority 3: Feature gating enforces API key limits per plan
 */

const express = require('express');
const { authMiddleware, tenantMiddleware, membershipMiddleware, requireTenantRole, rateLimitTenant, auditMiddleware, requireFeature, limitResourceCreation } = require('../middlewares');
const apiKeyController = require('../controllers/apiKeyController');

const router = express.Router();

// List API keys for tenant
router.get('/tenants/:slug/api-keys', 
  authMiddleware, 
  tenantMiddleware, 
  membershipMiddleware, 
  requireTenantRole('admin'), 
  rateLimitTenant, 
  apiKeyController.listApiKeys
);

// Get API key by ID
router.get('/tenants/:slug/api-keys/:id', 
  authMiddleware, 
  tenantMiddleware, 
  membershipMiddleware, 
  requireTenantRole('admin'), 
  rateLimitTenant, 
  apiKeyController.getApiKeyById
);

// Get API key statistics
router.get('/tenants/:slug/api-keys/:id/stats', 
  authMiddleware, 
  tenantMiddleware, 
  membershipMiddleware, 
  requireTenantRole('admin'), 
  rateLimitTenant, 
  apiKeyController.getApiKeyStats
);

// Create API key (returns plaintext once)
// Priority 3: Feature gate - requires pro plan for API access
// Priority 3: Resource limit - max 5 API keys per tenant
router.post('/tenants/:slug/api-keys', 
  authMiddleware, 
  tenantMiddleware, 
  membershipMiddleware, 
  requireTenantRole('admin'), 
  rateLimitTenant, 
  requireFeature('apiAccess'),
  limitResourceCreation('maxApiKeys', 'ApiKey'),
  auditMiddleware('CREATE', 'ApiKey'), 
  apiKeyController.createApiKey
);

// Update API key (label/scopes only)
router.put('/tenants/:slug/api-keys/:id', 
  authMiddleware, 
  tenantMiddleware, 
  membershipMiddleware, 
  requireTenantRole('admin'), 
  rateLimitTenant, 
  auditMiddleware('UPDATE', 'ApiKey'), 
  apiKeyController.updateApiKey
);

// Revoke API key (soft delete)
router.delete('/tenants/:slug/api-keys/:id', 
  authMiddleware, 
  tenantMiddleware, 
  membershipMiddleware, 
  requireTenantRole('admin'), 
  rateLimitTenant, 
  auditMiddleware('UPDATE', 'ApiKey'), 
  apiKeyController.revokeApiKey
);

// Permanently delete API key
router.delete('/tenants/:slug/api-keys/:id/permanent', 
  authMiddleware, 
  tenantMiddleware, 
  membershipMiddleware, 
  requireTenantRole('admin'), 
  rateLimitTenant, 
  auditMiddleware('DELETE', 'ApiKey'), 
  apiKeyController.deleteApiKey
);

// Reactivate revoked API key
router.post('/tenants/:slug/api-keys/:id/activate', 
  authMiddleware, 
  tenantMiddleware, 
  membershipMiddleware, 
  requireTenantRole('admin'), 
  rateLimitTenant, 
  auditMiddleware('UPDATE', 'ApiKey'), 
  apiKeyController.activateApiKey
);

module.exports = router;
