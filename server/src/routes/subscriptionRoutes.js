/**
 * Subscription routes: billing, plans, usage, and account management.
 * Also includes legacy license verification endpoint (moved from licenseRoutes.js).
 * Protect admin-only endpoints with requireTenantRole('admin').
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const subscriptionController = require('../controllers/subscriptionController');
const { authMiddleware, tenantMiddleware, membershipMiddleware, requireTenantRole } = require('../middlewares');

// ============== Public/Authenticated Routes ==============

// List all available plans (authenticated users from any tenant)
router.get('/billing/plans', authMiddleware, tenantMiddleware, membershipMiddleware, subscriptionController.listPlans);

// Get current subscription info (requires tenant context and membership)
router.get('/billing/subscription', authMiddleware, tenantMiddleware, membershipMiddleware, subscriptionController.getSubscription);

// Get usage metrics vs plan limits (requires tenant context and membership)
router.get('/billing/usage', authMiddleware, tenantMiddleware, membershipMiddleware, subscriptionController.getUsage);

// ============== Admin Routes ==============

// Upgrade to a different plan (admin only, usually called by payment webhook)
router.post('/billing/upgrade', authMiddleware, tenantMiddleware, membershipMiddleware, requireTenantRole('admin'), subscriptionController.upgradePlan);

// Cancel/downgrade subscription (admin only)
router.post('/billing/cancel', authMiddleware, tenantMiddleware, membershipMiddleware, requireTenantRole('admin'), subscriptionController.cancelSubscription);

module.exports = router;
