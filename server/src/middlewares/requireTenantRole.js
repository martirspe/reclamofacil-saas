// Requires membershipMiddleware to have set req.membership with a role
const requireTenantRole = (...allowedRoles) => {
  return (req, res, next) => {
    // If authenticated via API key, skip role check (scopes should be validated separately)
    if (req.apiKey) {
      return next();
    }

    if (!req.membership) {
      return res.status(403).json({ message: 'Membresía requerida' });
    }

    const role = req.membership.role;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: 'Rol insuficiente para esta acción' });
    }

    next();
  };
};

module.exports = requireTenantRole;
