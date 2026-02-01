/**
 * Summary Job Routes
 * Admin API endpoints for managing daily/weekly summary jobs
 * All endpoints require tenant admin or superadmin role
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const summaryJobController = require('../controllers/summaryJobController');
const authMiddleware = require('../middlewares/authMiddleware');
const { tenantMiddleware, membershipMiddleware, requireTenantRole } = require('../middlewares');

/**
 * All routes in this file require authentication and admin role
 * Routes are tenant-scoped: admins can only manage jobs for their own tenant
 */
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(membershipMiddleware);
router.use(requireTenantRole('admin'));

/**
 * GET /admin/jobs/summary/status
 * Get scheduler status and active jobs information
 */
router.get(
  '/status',
  summaryJobController.getSchedulerStatus
);

/**
 * POST /admin/jobs/summary/trigger-daily
 * Manually trigger daily summary emails
 * 
 * Query Parameters (all optional):
 *   - tenantId: Send only to users in specific tenant
 *   - userId: Send only to specific user (requires tenantId context)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "processed": 15,
 *     "sent": 14,
 *     "failed": 1,
 *     "skipped": 0,
 *     "errors": ["User 123: Email service error"]
 *   },
 *   "message": "Daily summaries triggered: 14 sent, 1 failed"
 * }
 */
router.post(
  '/trigger-daily',
  summaryJobController.triggerDailySummaries
);

/**
 * POST /admin/jobs/summary/trigger-weekly
 * Manually trigger weekly summary emails for all users with weekly preference
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "processed": 8,
 *     "sent": 8,
 *     "failed": 0,
 *     "errors": []
 *   },
 *   "message": "Weekly summaries triggered: 8 sent, 0 failed"
 * }
 */
router.post(
  '/trigger-weekly',
  summaryJobController.triggerWeeklySummaries
);

/**
 * GET /admin/jobs/summary/preview/:userId
 * Generate and preview summary data without sending email
 * Useful for testing and validation
 * 
 * Params:
 *   - userId: User ID to preview summary for
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "newCount": 5,
 *     "pendingCount": 3,
 *     "processingCount": 8,
 *     "resolvedCount": 2,
 *     "avgResolutionTime": "3.2 días",
 *     "resolutionRate": 75,
 *     "dateRange": "miércoles, 15 de enero de 2025",
 *     ...
 *   },
 *   "message": "Summary preview generated (email not sent)"
 * }
 */
router.get(
  '/preview/:userId',
  summaryJobController.previewSummary
);

/**
 * GET /admin/jobs/summary/users-with-daily
 * List all users with daily digest preference
 * 
 * Query Parameters (optional):
 *   - tenantId: Filter to specific tenant
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "userId": "uuid",
 *       "email": "user@example.com",
 *       "name": "John Doe",
 *       "tenantId": "uuid",
 *       "tenantName": "Acme Corp",
 *       "preferredTime": "09:00:00",
 *       "enabled": true
 *     },
 *     ...
 *   ],
 *   "total": 15,
 *   "message": "Found 15 users with daily digest preference"
 * }
 */
router.get(
  '/users/daily',
  summaryJobController.getUsersWithDailyDigest
);

/**
 * GET /admin/jobs/summary/users-with-weekly
 * List all users with weekly digest preference
 * 
 * Query Parameters (optional):
 *   - tenantId: Filter to specific tenant
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "userId": "uuid",
 *       "email": "user@example.com",
 *       "name": "John Doe",
 *       "tenantId": "uuid",
 *       "tenantName": "Acme Corp",
 *       "preferredTime": "09:00:00",
 *       "enabled": true
 *     },
 *     ...
 *   ],
 *   "total": 8,
 *   "message": "Found 8 users with weekly digest preference"
 * }
 */
router.get(
  '/users/weekly',
  summaryJobController.getUsersWithWeeklyDigest
);

/**
 * GET /api/admin/jobs/summary/preview/:userId
 * Generate and preview summary data without sending email
 */
router.get(
  '/preview/:userId',
  summaryJobController.previewSummary
);

module.exports = router;
