/**
 * Summary Job Controller
 * Provides API endpoints for managing and monitoring summary jobs
 * Admin only functionality for testing and manual triggers
 */

const { validationResult } = require('express-validator');
const { User, Tenant, NotificationPreference, UserTenant } = require('../models');
const claimSummaryJob = require('../jobs/claimSummaryJob');
const dailySummaryService = require('../services/dailySummaryService');

/**
 * GET /admin/jobs/summary/status
 * Get scheduler status and job information
 */
exports.getSchedulerStatus = async (req, res) => {
  try {
    const status = claimSummaryJob.getSchedulerStatus();
    
    res.json({
      success: true,
      data: {
        scheduler: status,
        lastCheck: new Date().toISOString()
      },
      message: `Scheduler has ${status.totalJobs} active jobs`
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scheduler status',
      message: error.message
    });
  }
};

/**
 * POST /admin/jobs/summary/trigger-daily
 * Manually trigger daily summary emails for current tenant
 * Optional query params:
 *   - userId: Send only to specific user (within current tenant)
 */
exports.triggerDailySummaries = async (req, res) => {
  try {
    const { userId } = req.query;
    const tenantId = req.tenant?.id; // Always use current tenant context

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant context required'
      });
    }

    let validUserId = null;

    // Validate user if provided (must belong to current tenant)
    if (userId) {
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user belongs to the tenant
      const membership = await UserTenant.findOne({
        where: {
          user_id: userId,
          tenant_id: tenantId
        }
      });
      
      if (!membership) {
        return res.status(404).json({
          success: false,
          message: 'User not found in your tenant'
        });
      }
      validUserId = userId;
    }

    const result = await claimSummaryJob.triggerDailySummaries(tenantId, validUserId);

    res.json({
      success: true,
      data: result,
      message: `Daily summaries triggered: ${result.sent} sent, ${result.failed} failed`
    });
  } catch (error) {
    console.error('Error triggering daily summaries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger daily summaries',
      message: error.message
    });
  }
};

/**
 * POST /admin/jobs/summary/trigger-weekly
 * Manually trigger weekly summary emails for current tenant
 */
exports.triggerWeeklySummaries = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant context required'
      });
    }

    const result = await claimSummaryJob.triggerWeeklySummaries(tenantId);

    res.json({
      success: true,
      data: result,
      message: `Weekly summaries triggered: ${result.sent} sent, ${result.failed} failed`
    });
  } catch (error) {
    console.error('Error triggering weekly summaries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger weekly summaries',
      message: error.message
    });
  }
};

/**
 * GET /admin/jobs/summary/preview/:userId
 * Generate preview data without sending email for user in current tenant
 * Params:
 *   - userId: User ID to preview summary for
 */
exports.previewSummary = async (req, res) => {
  try {
    const { userId } = req.params;
    const tenantId = req.tenant?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required in URL path'
      });
    }

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant context required'
      });
    }

    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user belongs to the tenant
    const membership = await UserTenant.findOne({
      where: {
        user_id: userId,
        tenant_id: tenantId
      }
    });
    
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'User not found in your tenant'
      });
    }

    const tenant = req.tenant;

    const summaryData = await dailySummaryService.generateSummaryData(user, tenant);

    res.json({
      success: true,
      data: summaryData,
      message: 'Summary preview generated (email not sent)'
    });
  } catch (error) {
    console.error('Error previewing summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating summary: ' + (error.message || 'Unknown error'),
      error: error.message || 'Unknown error'
    });
    res.status(500).json({
      success: false,
      error: 'Failed to preview summary',
      message: error.message
    });
  }
};

/**
 * GET /admin/jobs/summary/users-with-daily
 * List users in current tenant with daily digest preference
 */
exports.getUsersWithDailyDigest = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant context required'
      });
    }

    const preferences = await NotificationPreference.findAll({
      where: {
        batch_digest: 'daily',
        tenant_id: tenantId
      },
      include: [
        { model: User, attributes: ['id', 'email', 'first_name', 'last_name'] },
        { model: Tenant, attributes: ['id', 'name'] }
      ],
      order: [['preferred_notification_time', 'ASC']],
      raw: false
    });

    const userData = preferences.map(pref => ({
      userId: pref.User.id,
      email: pref.User.email,
      name: `${pref.User.first_name} ${pref.User.last_name}`,
      tenantId: pref.Tenant.id,
      tenantName: pref.Tenant.name,
      preferredTime: pref.preferred_notification_time,
      enabled: pref.email_notifications_enabled
    }));

    res.json({
      success: true,
      data: userData,
      total: userData.length,
      message: `Found ${userData.length} users with daily digest preference`
    });
  } catch (error) {
    console.error('Error fetching users with daily digest:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  }
};

/**
 * GET /admin/jobs/summary/users-with-weekly
 * List users in current tenant with weekly digest preference
 */
exports.getUsersWithWeeklyDigest = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant context required'
      });
    }

    const preferences = await NotificationPreference.findAll({
      where: {
        batch_digest: 'weekly',
        tenant_id: tenantId
      },
      include: [
        { model: User, attributes: ['id', 'email', 'first_name', 'last_name'] },
        { model: Tenant, attributes: ['id', 'name'] }
      ],
      order: [['preferred_notification_time', 'ASC']],
      raw: false
    });

    const userData = preferences.map(pref => ({
      userId: pref.User.id,
      email: pref.User.email,
      name: `${pref.User.first_name} ${pref.User.last_name}`,
      tenantId: pref.Tenant.id,
      tenantName: pref.Tenant.name,
      preferredTime: pref.preferred_notification_time,
      enabled: pref.email_notifications_enabled
    }));

    res.json({
      success: true,
      data: userData,
      total: userData.length,
      message: `Found ${userData.length} users with weekly digest preference`
    });
  } catch (error) {
    console.error('Error fetching users with weekly digest:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  }
};
