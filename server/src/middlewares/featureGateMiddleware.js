/**
 * Feature Gate Middleware
 * Validates tenant plan access to features and enforces usage limits
 * Ensures free-tier users can't exceed quotas (10 claims, 1 API key, etc)
 */

const { Subscription } = require('../models');
const { hasFeature } = require('../config/planFeatures');
const logger = require('../utils/logger');

/**
 * Middleware factory: requires a specific feature in the tenant's plan
 * @param {string} featureName - Feature key (e.g., 'apiAccess', 'customBranding')
 * @param {function} customCheck - optional async function(subscription) => boolean
 * @returns {function} middleware
 */
const requireFeature = (featureName, customCheck = null) => {
  return async (req, res, next) => {
    try {
      if (!req.tenant) {
        return res.status(400).json({ message: 'Tenant no encontrado en request' });
      }

      // Superadmin has access to all features (for support/debugging)
      if (req.user?.role === 'superadmin') {
        return next();
      }

      const subscription = await Subscription.findOne({
        where: { tenant_id: req.tenant.id }
      });

      // Determine plan (default to free)
      const planName = subscription?.plan_name || 'free';

      // Master plan has access to all features
      if (planName === 'master') {
        return next();
      }
      
      // Check if feature is available in plan
      const hasAccess = hasFeature(planName, featureName);

      if (!hasAccess) {
        return res.status(403).json({
          message: `Feature "${featureName}" no disponible en plan ${planName}. Actualice su suscripción.`,
          plan: planName,
          required_plan: 'pro',
          upgrade_url: `/api/tenants/${req.tenant.slug}/billing/upgrade`
        });
      }

      // Optional custom validation (e.g., check usage limits)
      if (customCheck) {
        const customResult = await customCheck(subscription);
        if (!customResult) {
          return res.status(403).json({
            message: `Límite de uso alcanzado para "${featureName}". Actualice su suscripción.`,
            plan: planName,
            upgrade_url: `/api/tenants/${req.tenant.slug}/billing/upgrade`
          });
        }
      }

      req.subscription = subscription;
      next();
    } catch (err) {
      logger.error({ err }, 'Error validando feature');
      res.status(500).json({ message: 'Error validando feature' });
    }
  };
};

module.exports = requireFeature;
