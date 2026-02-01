const express = require('express');

// Route configuration
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const customerRoutes = require('./customerRoutes');
const tutorRoutes = require('./tutorRoutes');
const documentTypeRoutes = require('./documentTypeRoutes');
const consumptionTypeRoutes = require('./consumptionTypeRoutes');
const claimTypeRoutes = require('./claimTypeRoutes');
const currencyRoutes = require('./currencyRoutes');
const locationRoutes = require('./locationRoutes');
const claimRoutes = require('./claimRoutes');
const publicClaimRoutes = require('./publicClaimRoutes');
const tenantRoutes = require('./tenantRoutes');
const apiKeyRoutes = require('./apiKeyRoutes');
const integrationRoutes = require('./integrationRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');
const notificationPreferenceRoutes = require('./notificationPreferenceRoutes');
const phoneCountryRoutes = require('./phoneCountryRoutes');
const summaryJobRoutes = require('./summaryJobRoutes');

// Middleware imports for Priority features
const { rateLimitTenant } = require('../middlewares');

const router = express.Router();

// ===== GLOBAL RATE LIMITING (Priority 1) =====
// Apply rate limiting to all API endpoints: 100 requests/min per tenant
router.use('/api', rateLimitTenant);

// ===== ROUTE MOUNTING =====

// Public auth routes
router.use('/api', authRoutes);

// User API routes
router.use('/api', userRoutes);

// Client API routes
router.use('/api', customerRoutes);

// Tutor API routes
router.use('/api', tutorRoutes);

// Document type API routes
router.use('/api', documentTypeRoutes);

// Consumption type API routes
router.use('/api', consumptionTypeRoutes);

// Claim type API routes
router.use('/api', claimTypeRoutes);

// Currency API routes
router.use('/api', currencyRoutes);

// Location API routes
router.use('/api', locationRoutes);


// Claims API routes
router.use('/api', claimRoutes);

// Branches API routes
const branchRoutes = require('./branchRoutes');
router.use('/api/branches', branchRoutes);

// ComplaintBooks API routes
const complaintBookRoutes = require('./complaintBookRoutes');
router.use('/api/complaint-books', complaintBookRoutes);

// Public claim routes (no auth)
router.use('/api', publicClaimRoutes);

// Tenant/branding multi-tenant API routes
router.use('/api', tenantRoutes);

// API keys management (per-tenant)
router.use('/api', apiKeyRoutes);

// Integration routes (API key auth)
router.use('/api', integrationRoutes);

// Subscription/billing routes (SaaS plans) - includes legacy /license/:userId endpoint
router.use('/api/tenants/:slug', subscriptionRoutes);

// Notification preference routes (user settings)
router.use('/api/notification-preferences', notificationPreferenceRoutes);

// Summary job routes (admin only)
router.use('/api/phone-countries', phoneCountryRoutes);
router.use('/api/admin/jobs/summary', summaryJobRoutes);

module.exports = router;
