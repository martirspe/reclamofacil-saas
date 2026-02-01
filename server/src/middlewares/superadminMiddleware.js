/**
 * Superadmin Middleware
 * Verifies that the authenticated user has the 'superadmin' role.
 * This role is global and not tenant-specific, used for platform-wide operations.
 */

const superadminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Autenticación requerida' });
  }

  // Check for global superadmin role
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ 
      message: 'Acceso denegado. Se requiere rol de superadministrador.' 
    });
  }

  next();
};

module.exports = superadminMiddleware;
