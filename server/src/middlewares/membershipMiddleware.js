const { UserTenant } = require('../models');

// Verifica que el usuario autenticado sea miembro del tenant actual.
// Requiere que tenantMiddleware ya haya poblado req.tenant y authMiddleware req.user.
const membershipMiddleware = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Token requerido' });
    }
    if (!req.tenant?.id) {
      return res.status(400).json({ message: 'Tenant no resuelto' });
    }

    const membership = await UserTenant.findOne({ where: { user_id: req.user.id, tenant_id: req.tenant.id } });
    if (!membership) {
      return res.status(403).json({ message: 'El usuario no pertenece a este tenant' });
    }

    req.membership = membership;
    next();
  } catch (err) {
    req.log?.error({ err }, 'Error verificando membresía de tenant');
    res.status(500).json({ message: 'Error verificando membresía de tenant' });
  }
};

module.exports = membershipMiddleware;
