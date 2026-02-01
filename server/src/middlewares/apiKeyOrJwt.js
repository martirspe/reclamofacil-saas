const apiKeyMiddleware = require('./apiKeyMiddleware');
const authMiddleware = require('./authMiddleware');
const tenantMiddleware = require('./tenantMiddleware');
const membershipMiddleware = require('./membershipMiddleware');

// Hybrid auth: if an API key is provided, use it; otherwise require JWT + tenant + membership.
// Also validates that :slug (if present) matches the tenant resolved by API key.
const apiKeyOrJwt = async (req, res, next) => {
  const hasApiKey = !!req.header('x-api-key') || (req.header('authorization') || '').startsWith('ApiKey ');

  if (hasApiKey) {
    return apiKeyMiddleware(req, res, (err) => {
      if (err) return next(err);
      if (req.params?.slug && req.tenant?.slug && req.params.slug.toLowerCase() !== req.tenant.slug.toLowerCase()) {
        return res.status(403).json({ message: 'El tenant de la API key no coincide con la ruta' });
      }
      next();
    });
  }

  // Fallback to JWT + tenant + membership
  return authMiddleware(req, res, (err) => {
    if (err) return next(err);
    tenantMiddleware(req, res, (err2) => {
      if (err2) return next(err2);
      membershipMiddleware(req, res, next);
    });
  });
};

module.exports = apiKeyOrJwt;
