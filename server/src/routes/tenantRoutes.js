/**
 * Tenant routes: tenant info and CRUD operations
 * Includes tenant profile endpoints and full tenant management
 */

const express = require('express');
const { Tenant } = require('../models');
const tenantController = require('../controllers/tenantController');
const { authMiddleware, tenantMiddleware, membershipMiddleware, requireTenantRole, superadminMiddleware } = require('../middlewares');
const { uploadBranding } = require('../middlewares/uploadMiddleware');

const router = express.Router();

const resolveProtocol = (req) => {
  const proto = req.get('x-forwarded-proto') || req.protocol;
  const forceHttps = process.env.NODE_ENV === 'production' || process.env.FORCE_HTTPS === 'true';
  return forceHttps ? 'https' : proto;
};

const toAbsolute = (host, url) => {
  if (!url) return null;
  const value = String(url).trim();
  if (/^https?:\/\//i.test(value)) return value;
  return `${host}/${value.replace(/^\//, '')}`;
};

const sendTenantProfile = async (req, res, slug) => {
  try {
    const tenant = await Tenant.findOne({
      where: { slug },
      attributes: [
        'slug',
        'brand_name',
        'legal_name',
        'tax_id',
        'contact_phone',
        'address',
        'country',
        'industry',
        'contact_email',
        'website',
        'primary_color',
        'accent_color',
        'logo_light_url',
        'logo_dark_url',
        'favicon_url',
        'terms_url',
        'privacy_url',
        'active'
      ]
    });
    if (!tenant) return res.status(404).json({ message: 'Tenant no encontrado' });

    const hostHeader = req.get('host') || '';
    const host = `${resolveProtocol(req)}://${hostHeader}`;

    res.json({
      tenant: slug,
      brand_name: tenant.brand_name,
      legal_name: tenant.legal_name,
      tax_id: tenant.tax_id,
      contact_phone: tenant.contact_phone,
      address: tenant.address,
      country: tenant.country,
      industry: tenant.industry,
      website: tenant.website,
      primary_color: tenant.primary_color,
      accent_color: tenant.accent_color,
      logo_light_url: toAbsolute(host, tenant.logo_light_url),
      logo_dark_url: toAbsolute(host, tenant.logo_dark_url),
      favicon_url: toAbsolute(host, tenant.favicon_url),
      contact_email: tenant.contact_email,
      terms_url: tenant.terms_url,
      privacy_url: tenant.privacy_url,
      active: tenant.active
    });
  } catch (err) {
    req.log?.error({ err }, 'Error obteniendo información de tenant');
    res.status(500).json({ message: 'Error obteniendo información de tenant' });
  }
};

// ============== Public Tenant Branding Endpoints ==============
// These endpoints are public (no auth) for displaying tenant branding

// GET /api/tenants/:slug (tenant info)
router.get('/tenants/:slug', async (req, res) => {
  const { slug } = req.params;
  return sendTenantProfile(req, res, slug);
});

// GET /api/tenants/default (default tenant info)
router.get('/tenants/default', async (req, res) => {
  const slug = 'default';
  return sendTenantProfile(req, res, slug);
});

// ============== Superadmin Routes (Platform Management) ==============

// Create a new tenant (authenticated user OR superadmin)
// - Admin autenticado: Crea tenant y se auto-asigna como admin
// - Superadmin: Puede crear tenant Y especificar owner_id
router.post('/tenants', authMiddleware, tenantController.createTenant);

// Get all tenants with pagination and search (superadmin only)
router.get('/tenants', authMiddleware, superadminMiddleware, tenantController.getTenants);

// ============== Tenant Admin Routes (Self-Management) ==============

// Get tenant details with subscription info (tenant admin only)
router.get('/tenants/:slug/details', authMiddleware, tenantMiddleware, membershipMiddleware, requireTenantRole('admin'), tenantController.getTenantBySlug);

// Update tenant (branding + contact), admin only, allows multipart uploads
router.put(
  '/tenants/:slug',
  authMiddleware,
  tenantMiddleware,
  membershipMiddleware,
  requireTenantRole('admin'),
  uploadBranding,
  tenantController.updateTenant
);

// Delete tenant (superadmin only for safety)
router.delete('/tenants/:slug', authMiddleware, superadminMiddleware, tenantController.deleteTenant);

// Get tenant statistics (tenant admin only)
router.get('/tenants/:slug/stats', authMiddleware, tenantMiddleware, membershipMiddleware, requireTenantRole('admin'), tenantController.getTenantStats);

module.exports = router;
