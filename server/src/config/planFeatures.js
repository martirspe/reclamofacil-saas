/**
 * Plan Features Configuration - Opción A: Agresiva (Máxima Monetización)
 * Defines feature limits and capabilities by subscription plan
 * Used by featureGateMiddleware to enforce plan boundaries
 * 
 * Plans ordered from lowest to highest privilege:
 * 1. Free: $0/mes (friction alta para conversión)
 * 2. Starter: $29/mes (entrada fácil a pagos)
 * 3. Pro: $79/mes (para equipos reales)
 * 4. Enterprise: Custom pricing (soluciones corporativas)
 * 5. Master: Internal use only (tenant matriz)
 */

const PLAN_FEATURES = {
  free: {
    name: 'Free',
    price: 0,
    currency: 'USD',
    billingCycle: 'monthly',
    // Límites agresivos para fricción y conversión
    maxClaims: 5,
    maxUsers: 1,
    maxApiKeys: 0,             // Bloqueado completamente
    maxFileSize: 2 * 1024 * 1024, // 2MB
    maxStorageTotal: 100 * 1024 * 1024, // 100MB total
    apiRateLimit: 50, // requests per minute - muy bajo
    features: {
      basicReporting: false,   // Solo table view
      claimTracking: true,
      documentUpload: true,
      emailNotifications: false, // Bloqueado
      apiAccess: false,
      customBranding: false,
      advancedAnalytics: false,
      prioritySupport: false,
      sso: false,
      webhooks: false,
      dataExport: false,       // CSV export bloqueado
      customIntegrations: false
    }
  },

  starter: {
    name: 'Starter',
    price: 29,
    currency: 'USD',
    billingCycle: 'monthly',
    // Primer escalón de pago - entrada fácil
    maxClaims: 50,
    maxUsers: 3,
    maxApiKeys: 1,
    maxFileSize: 20 * 1024 * 1024, // 20MB
    maxStorageTotal: 1 * 1024 * 1024 * 1024, // 1GB
    apiRateLimit: 200, // Modesto pero usable
    features: {
      basicReporting: true,    // Desbloqueado
      claimTracking: true,
      documentUpload: true,
      emailNotifications: true, // Desbloqueado
      apiAccess: false,        // Aún bloqueado para Pro
      customBranding: false,
      advancedAnalytics: false,
      prioritySupport: false,
      sso: false,
      webhooks: false,
      dataExport: true,        // CSV export permitido
      customIntegrations: false
    }
  },

  pro: {
    name: 'Professional',
    price: 79,
    currency: 'USD',
    billingCycle: 'monthly',
    // Plan principal - para equipos reales
    maxClaims: 500,
    maxUsers: 10,
    maxApiKeys: 3,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxStorageTotal: 10 * 1024 * 1024 * 1024, // 10GB
    apiRateLimit: 500, // Bueno para integraciones
    features: {
      basicReporting: true,
      claimTracking: true,
      documentUpload: true,
      emailNotifications: true,
      apiAccess: true,         // Desbloqueado aquí
      customBranding: true,
      advancedAnalytics: true,
      prioritySupport: true,   // Email support
      sso: false,              // Para enterprise
      webhooks: true,
      dataExport: true,
      customIntegrations: false
    }
  },

  enterprise: {
    name: 'Enterprise',
    price: null,               // Custom pricing
    currency: 'USD',
    billingCycle: 'annual',
    // Plan premium - soluciones corporativas
    maxClaims: null,           // Unlimited
    maxUsers: null,            // Unlimited
    maxApiKeys: null,          // Unlimited
    maxFileSize: 500 * 1024 * 1024, // 500MB
    maxStorageTotal: 1000 * 1024 * 1024 * 1024, // 1TB
    apiRateLimit: 5000, // Alta capacidad
    features: {
      basicReporting: true,
      claimTracking: true,
      documentUpload: true,
      emailNotifications: true,
      apiAccess: true,
      customBranding: true,
      advancedAnalytics: true,
      prioritySupport: true,   // Phone + dedicated support
      sso: true,               // LDAP/SAML incluido
      webhooks: true,
      dataExport: true,
      customIntegrations: true // Integraciones personalizadas
    }
  },

  master: {
    name: 'Master',
    price: null,               // Not for sale
    currency: 'USD',
    billingCycle: 'lifetime',
    // Plan especial para tenant matriz - sin límites
    maxClaims: null,           // Unlimited
    maxUsers: null,            // Unlimited
    maxApiKeys: null,          // Unlimited
    maxFileSize: null,         // Unlimited
    maxStorageTotal: null,     // Unlimited
    apiRateLimit: null,        // Unlimited
    features: {
      basicReporting: true,
      claimTracking: true,
      documentUpload: true,
      emailNotifications: true,
      apiAccess: true,
      customBranding: true,
      advancedAnalytics: true,
      prioritySupport: true,
      sso: true,
      webhooks: true,
      dataExport: true,
      customIntegrations: true
    }
  }
};

/**
 * Get plan configuration by name
 * @param {string} planName - Plan identifier (free, starter, pro, enterprise, master)
 * @returns {Object} Plan configuration object
 */
function getPlanConfig(planName) {
  return PLAN_FEATURES[planName?.toLowerCase()] || PLAN_FEATURES.free;
}

/**
 * Check if a plan has a specific feature
 * @param {string} planName - Plan identifier
 * @param {string} featureName - Feature key
 * @returns {boolean} Whether feature is enabled for plan
 */
function hasFeature(planName, featureName) {
  const config = getPlanConfig(planName);
  return config.features[featureName] === true;
}

/**
 * Check if resource limit exceeded
 * @param {string} planName - Plan identifier
 * @param {string} resourceType - Resource key (maxClaims, maxUsers, etc.)
 * @param {number} currentCount - Current count of resource
 * @returns {boolean} Whether limit exceeded
 */
function isLimitExceeded(planName, resourceType, currentCount) {
  const config = getPlanConfig(planName);
  const limit = config[resourceType];

  // null means unlimited
  if (limit === null) return false;

  return currentCount >= limit;
}

/**
 * Get remaining quota for a resource
 * @param {string} planName - Plan identifier
 * @param {string} resourceType - Resource key
 * @param {number} currentCount - Current count of resource
 * @returns {number|null} Remaining quota or null if unlimited
 */
function getRemainingQuota(planName, resourceType, currentCount) {
  const config = getPlanConfig(planName);
  const limit = config[resourceType];

  if (limit === null) return null; // unlimited
  return Math.max(0, limit - currentCount);
}

/**
 * Get plan price in display format
 * @param {string} planName - Plan identifier
 * @returns {string} Formatted price (e.g., "$29/month", "Custom")
 */
function getPlanPrice(planName) {
  const config = getPlanConfig(planName);
  if (planName === 'master') {
    return 'Master Account';
  }
  if (config.price === null) {
    return 'Custom pricing';
  }
  if (config.price === 0) {
    return 'Free';
  }
  return `$${config.price}/${config.billingCycle}`;
}

/**
 * Get all available plans
 * @returns {Array} Array of plan configurations
 */
function getAllPlans() {
  return Object.values(PLAN_FEATURES);
}

/**
 * Compare two plans - returns features unique to plan B
 * @param {string} planA - First plan
 * @param {string} planB - Second plan
 * @returns {Object} Features in planB but not in planA
 */
function getPlanDifferences(planA, planB) {
  const configA = getPlanConfig(planA);
  const configB = getPlanConfig(planB);

  const differences = {
    newFeatures: [],
    higherLimits: {}
  };

  // Find new features
  Object.keys(configB.features).forEach(feature => {
    if (!configA.features[feature] && configB.features[feature]) {
      differences.newFeatures.push(feature);
    }
  });

  // Find higher limits
  ['maxClaims', 'maxUsers', 'maxApiKeys', 'maxFileSize', 'maxStorageTotal', 'apiRateLimit'].forEach(limit => {
    const limA = configA[limit];
    const limB = configB[limit];

    if (limB === null) {
      differences.higherLimits[limit] = 'Unlimited';
    } else if (limA !== null && limB > limA) {
      differences.higherLimits[limit] = limB;
    }
  });

  return differences;
}

module.exports = {
  PLAN_FEATURES,
  getPlanConfig,
  hasFeature,
  isLimitExceeded,
  getRemainingQuota,
  getPlanPrice,
  getAllPlans,
  getPlanDifferences
};
