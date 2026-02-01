/**
 * Subscription controller: manage SaaS plans, billing, usage, and subscriptions.
 * 
 * This controller consolidates all subscription/license management logic:
 * - Plan listing and details
 * - Subscription status checking
 * - Usage/metering against plan limits
 * - Plan upgrades/downgrades
 * 
 * In production, integrate payment methods (Stripe, PayPal) for upgradePlan() webhook handling.
 */

const { Subscription, Tenant } = require('../models');
const { PLAN_FEATURES, getPlanConfig, getAllPlans } = require('../config/planFeatures');

// Get current subscription for a tenant
exports.getSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { tenant_id: req.tenant.id },
      include: [{ model: Tenant, attributes: ['id', 'slug', 'legal_name', 'brand_name', 'tax_id'] }]
    });

    if (!subscription) {
      return res.status(200).json({
        message: 'No hay suscripción activa (plan free por defecto)',
        plan_name: 'free',
        plan_details: getPlanConfig('free')
      });
    }

    res.json({
      subscription,
      plan_details: getPlanConfig(subscription.plan_name)
    });
  } catch (err) {
    req.log?.error({ err }, 'Error obteniendo suscripción');
    res.status(500).json({ message: 'Error obteniendo suscripción' });
  }
};

// List all available plans
exports.listPlans = (req, res) => {
  const plans = getAllPlans().map((plan, index) => {
    const keys = Object.keys(PLAN_FEATURES);
    return {
      id: keys[index],
      ...plan
    };
  });
  res.json(plans);
};

// Upgrade plan (admin only, typically called from billing webhook or dashboard)
// In production, this is triggered after Stripe payment confirmation
exports.upgradePlan = async (req, res) => {
  try {
    const { plan_name, payment_provider_id, billing_cycle_start, billing_cycle_end } = req.body;

    if (!plan_name || !PLAN_FEATURES[plan_name]) {
      return res.status(400).json({ message: 'Plan inválido' });
    }

    let subscription = await Subscription.findOne({
      where: { tenant_id: req.tenant.id }
    });

    if (!subscription) {
      subscription = await Subscription.create({
        tenant_id: req.tenant.id,
        plan_name,
        status: 'active',
        billing_cycle_start: billing_cycle_start || new Date(),
        billing_cycle_end,
        payment_provider_id
      });
    } else {
      subscription.plan_name = plan_name;
      subscription.status = 'active';
      subscription.billing_cycle_start = billing_cycle_start || new Date();
      subscription.billing_cycle_end = billing_cycle_end;
      if (payment_provider_id) subscription.payment_provider_id = payment_provider_id;
      await subscription.save();
    }

    res.json({
      message: `Plan actualizado a ${plan_name}`,
      subscription,
      plan_details: getPlanConfig(plan_name)
    });
  } catch (err) {
    req.log?.error({ err }, 'Error upgradando plan');
    res.status(500).json({ message: 'Error upgradando plan' });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const { reason } = req.body;

    const subscription = await Subscription.findOne({
      where: { tenant_id: req.tenant.id }
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Suscripción no encontrada' });
    }

    subscription.status = 'cancelled';
    subscription.cancelled_at = new Date();
    subscription.cancellation_reason = reason || null;
    await subscription.save();

    res.json({
      message: 'Suscripción cancelada',
      subscription
    });
  } catch (err) {
    req.log?.error({ err }, 'Error cancelando suscripción');
    res.status(500).json({ message: 'Error cancelando suscripción' });
  }
};

// Get usage/metrics for current plan (example: claim count this month)
exports.getUsage = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { tenant_id: req.tenant.id }
    });

    const { Claim, User } = require('../models');
    const Sequelize = require('sequelize');
    const thisMonth = new Date();
    thisMonth.setDate(1);

    const claimCount = await Claim.count({
      where: {
        tenant_id: req.tenant.id,
        creation_date: { [Sequelize.Op.gte]: thisMonth }
      }
    });

    const userCount = await User.count({
      where: { tenant_id: req.tenant.id }
    });

      const planConfig = getPlanConfig(subscription?.plan_name);

    res.json({
      plan_name: subscription?.plan_name || 'free',
      usage: {
        claims_this_month: claimCount,
          claims_limit: planConfig.maxClaims === null ? 'Unlimited' : planConfig.maxClaims,
        users: userCount,
          users_limit: planConfig.maxUsers === null ? 'Unlimited' : planConfig.maxUsers
      },
      warnings: {
        claims_approaching_limit: typeof planConfig.maxClaims === 'number' && claimCount >= (planConfig.maxClaims * 0.8),
        users_approaching_limit: typeof planConfig.maxUsers === 'number' && userCount >= (planConfig.maxUsers * 0.8)
      }
    });
  } catch (err) {
    req.log?.error({ err }, 'Error obteniendo uso');
    res.status(500).json({ message: 'Error obteniendo uso' });
  }
};
