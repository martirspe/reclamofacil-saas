const { Tenant } = require('../models');

// Resolve and validate tenant context for a request.
// Sources (priority order): route param `:slug`, header `x-tenant`/`x-tenant-slug`.
// If `req.user.tenant_slug` exists (JWT claim), enforce it matches the resolved tenant.
const resolveSubdomainSlug = (req) => {
  const host = req.get('host');
  if (!host) return null;
  const hostname = host.split(':')[0];
  const parts = hostname.split('.');
  if (parts.length < 3) return null; // e.g. api.domain.com or tenant.domain.com
  const sub = parts[0].toLowerCase();
  if (sub === 'www') return null;
  return sub;
};

const tenantMiddleware = async (req, res, next) => {
  try {
    const paramSlug = req.params?.slug;
    const headerSlug = req.header('x-tenant') || req.header('x-tenant-slug');
    const subdomainSlug = resolveSubdomainSlug(req);
    const slug = (paramSlug || headerSlug || subdomainSlug || '').toString().trim().toLowerCase();

    if (!slug) {
      return res.status(400).json({ message: 'Falta el tenant slug (use ruta /tenants/:slug o header x-tenant).' });
    }

    const tenant = await Tenant.findOne({ where: { slug } });
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant no encontrado' });
    }

    // Note: We don't validate req.user.tenant_slug here because:
    // 1. Users can have membership in multiple tenants
    // 2. membershipMiddleware will validate actual membership in the DB
    // 3. This allows superadmins and multi-tenant users to access any tenant they belong to

    req.tenant = tenant;
    next();
  } catch (err) {
    req.log?.error({ err }, 'Error resolviendo tenant');
    res.status(500).json({ message: 'Error resolviendo tenant' });
  }
};

module.exports = tenantMiddleware;
