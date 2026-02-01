/**
 * Resource Limit Middleware
 * Enforces plan-based quotas (max claims, users, API keys, etc)
 * Usage: limitResourceCreation('claims', 'Claim')
 */

const { Subscription } = require('../models');
const { isLimitExceeded, getRemainingQuota } = require('../config/planFeatures');
const logger = require('../utils/logger');

/**
 * Middleware factory: enforces creation limits for a resource type
 * @param {string} resourceKey - Config key (maxClaims, maxUsers, maxCustomers, maxTutors, maxApiKeys)
 * @param {string} modelName - Sequelize model name (Claim, User, Customer, Tutor, ApiKey)
 * @returns {function} middleware
 */
const limitResourceCreation = (resourceKey, modelName) => {
  return async (req, res, next) => {
    try {
      if (!req.tenant) {
        return res.status(400).json({ message: 'Tenant no encontrado en request' });
      }

      // Superadmin bypasses all limits (for support/debugging)
      if (req.user?.role === 'superadmin') {
        return next();
      }

      // Get tenant's subscription
      const subscription = await Subscription.findOne({
        where: { tenant_id: req.tenant.id }
      });

      const planName = subscription?.plan_name || 'free';

      // Master plan bypasses all limits
      if (planName === 'master') {
        return next();
      }

      // Get model and count existing resources
      const { sequelize } = require('../config/db');
      const models = require('../models');
      const Model = models[modelName];

      if (!Model) {
        logger.warn({ modelName }, 'Model not found for limit check');
        return next(); // Fail open if model not found
      }

      let currentCount;
      
      // Count based on model - filter by tenant
      if (modelName === 'User') {
        // For users, count active users in this tenant
        const { UserTenant } = models;
        currentCount = await UserTenant.count({
          where: { tenant_id: req.tenant.id }
        });
      } else {
        // For other resources, count by tenant_id
        currentCount = await Model.count({
          where: { tenant_id: req.tenant.id }
        });
      }

      // Check if limit exceeded
      const limitExceeded = isLimitExceeded(planName, resourceKey, currentCount);

      if (limitExceeded) {
        const remaining = getRemainingQuota(planName, resourceKey, currentCount);
        logger.warn({
          tenant_id: req.tenant.id,
          plan: planName,
          resource: modelName,
          current: currentCount,
          remaining
        }, 'Resource limit exceeded');

        return res.status(403).json({
          message: `Límite de ${modelName.toLowerCase()} alcanzado para plan ${planName}`,
          plan: planName,
          resource: modelName,
          current_count: currentCount,
          limit: require('../config/planFeatures').getPlanConfig(planName)[resourceKey],
          remaining_quota: remaining,
          upgrade_url: `/api/tenants/${req.tenant.slug}/billing/upgrade`
        });
      }

      // Attach quota info to request for response
      const remaining = getRemainingQuota(planName, resourceKey, currentCount);
      req.quota = {
        resource: modelName,
        current: currentCount,
        remaining: remaining,
        limit: require('../config/planFeatures').getPlanConfig(planName)[resourceKey]
      };

      next();
    } catch (err) {
      logger.error({ err, resourceKey, modelName }, 'Error checking resource limit');
      // Fail open - allow request to proceed, log error
      next();
    }
  };
};

module.exports = limitResourceCreation;
