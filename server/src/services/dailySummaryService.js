/**
 * Daily Summary Service
 * Generates daily summary emails for users with batch_digest='daily' preference
 * Includes claim statistics, pending actions, and recent activity
 */

const { Claim, ClaimType, User, Tenant, NotificationPreference } = require('../models');
const { Op, sequelize } = require('sequelize');
const emailService = require('./emailService');
const { getNotificationEmail, getPreferences } = require('../utils/notificationPreferenceHelper');

/**
 * Generate daily summary data for a user
 * @param {Object} user - User object
 * @param {Object} tenant - Tenant object
 * @returns {Promise<Object>} Summary data object
 */
async function generateSummaryData(user, tenant) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  try {
    // Get claim counts by status
    const [newCount, pendingCount, processingCount, resolvedCount] = await Promise.all([
      // New claims (created today for this tenant)
      Claim.count({
        where: {
          tenant_id: tenant.id,
          creation_date: { [Op.between]: [startOfDay, endOfDay] }
        }
      }),
      
      // Pending claims (new status)
      Claim.count({
        where: {
          tenant_id: tenant.id,
          status: 'new',
          assigned_user: null
        }
      }),
      
      // Processing claims (assigned or in progress)
      Claim.count({
        where: {
          tenant_id: tenant.id,
          status: { [Op.in]: ['assigned', 'in_progress'] }
        }
      }),
      
      // Resolved claims (today)
      Claim.count({
        where: {
          tenant_id: tenant.id,
          resolved: true,
          update_date: { [Op.between]: [startOfDay, endOfDay] }
        }
      })
    ]);

    // Get claims requiring attention (overdue - more than 48 hours old)
    const tasksRequiringAttention = await Claim.findAll({
      where: {
        tenant_id: tenant.id,
        status: { [Op.in]: ['new', 'assigned', 'in_progress'] },
        creation_date: { 
          [Op.lt]: new Date(Date.now() - 48 * 60 * 60 * 1000) // More than 48 hours old
        }
      },
      limit: 5,
      order: [['creation_date', 'ASC']],
      raw: true
    });

    // Get recent activity (last 10 claims updated)
    const recentActivity = await Claim.findAll({
      where: {
        tenant_id: tenant.id,
        update_date: { [Op.between]: [startOfDay, endOfDay] }
      },
      limit: 10,
      order: [['update_date', 'DESC']],
      raw: true,
      attributes: ['id', 'code', 'status', 'update_date']
    });

    // Calculate average resolution time (last 30 days, resolved claims)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const resolvedClaimsThisMonth = await Claim.findAll({
      where: {
        tenant_id: tenant.id,
        resolved: true,
        update_date: { [Op.gte]: thirtyDaysAgo }
      },
      attributes: ['creation_date', 'update_date'],
      raw: true
    });

    let avgResolutionTime = 'N/A';
    if (resolvedClaimsThisMonth.length > 0) {
      const totalTime = resolvedClaimsThisMonth.reduce((acc, claim) => {
        const time = new Date(claim.update_date) - new Date(claim.creation_date);
        return acc + time;
      }, 0);
      
      const avgMs = totalTime / resolvedClaimsThisMonth.length;
      const avgDays = Math.round(avgMs / (1000 * 60 * 60 * 24) * 10) / 10;
      avgResolutionTime = `${avgDays} días`;
    }

    // Calculate resolution rate (resolved / total)
    const totalClaimsThisMonth = await Claim.count({
      where: {
        tenant_id: tenant.id,
        creation_date: { [Op.gte]: thirtyDaysAgo }
      }
    });

    const resolutionRate = totalClaimsThisMonth > 0 
      ? Math.round((resolvedClaimsThisMonth.length / totalClaimsThisMonth) * 100)
      : 0;

    // Format tasks for email
    const tasksList = tasksRequiringAttention.map(claim => ({
      code: claim.code,
      reason: 'Más de 48 horas sin resolver'
    }));

    // Format recent activity for email
    const recentActivityFormatted = recentActivity.map(claim => {
      const statusMap = {
        'new': 'Creado',
        'assigned': 'Asignado',
        'in_progress': 'En proceso',
        'resolved': 'Resuelto'
      };
      
      const updatedTime = new Date(claim.update_date);
      const hours = updatedTime.getHours().toString().padStart(2, '0');
      const minutes = updatedTime.getMinutes().toString().padStart(2, '0');
      
      return {
        code: claim.code,
        action: statusMap[claim.status] || claim.status,
        time: `${hours}:${minutes}`
      };
    });

    // Get current date range for display
    const today = new Date();
    const dateRange = `${today.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`;

    return {
      newCount,
      pendingCount,
      processingCount,
      resolvedCount,
      tasksList: tasksList.length > 0 ? tasksList : null,
      recentActivity: recentActivityFormatted.length > 0 ? recentActivityFormatted : null,
      avgResolutionTime,
      resolutionRate,
      dateRange,
      companyName: tenant.legal_name || tenant.brand_name || 'ReclamoFácil',
      currentYear: new Date().getFullYear(),
      dashboardUrl: process.env.FRONTEND_URL 
        ? `${process.env.FRONTEND_URL}/dashboard?tenant=${tenant.id}`
        : 'https://app.reclamofacil.com/dashboard'
    };
  } catch (error) {
    console.error(`Error generating summary data for user ${user.id} in tenant ${tenant.id}:`, error);
    throw error;
  }
}

/**
 * Send daily summary email to a user
 * @param {Object} user - User object
 * @param {Object} tenant - Tenant object
 * @param {Object} summaryData - Pre-generated summary data
 * @returns {Promise<boolean>} Success indicator
 */
async function sendDailySummaryEmail(user, tenant, summaryData) {
  try {
    if (!summaryData) {
      summaryData = await generateSummaryData(user, tenant);
    }

    if (!summaryData) {
      console.error(`Failed to generate summary data for ${user.id}`);
      return false;
    }

    const notificationEmail = await getNotificationEmail(user.id, tenant.id, user.email);

    await emailService.sendEmail({
      to: notificationEmail,
      subject: `📊 Resumen Diario - ${summaryData.dateRange}`,
      templateName: 'dailySummary',
      templateType: 'staff',
      replacements: summaryData,
      tenant
    });

    console.log(`✓ Daily summary email sent to ${user.id} (${notificationEmail})`);
    return true;
  } catch (error) {
    console.error(`Error sending daily summary to user ${user.id}:`, error);
    return false;
  }
}

/**
 * Process all daily summaries for a specific time
 * Called by the scheduler job
 * @param {string} targetTime - Time to send (HH:mm:ss format)
 * @returns {Promise<Object>} Statistics about emails sent
 */
async function processDailySummaries(targetTime = null) {
  const stats = {
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  try {
    // Get all active tenants
    const tenants = await Tenant.findAll({
      where: { active: true },
      raw: true
    });

    for (const tenant of tenants) {
      try {
        // Get all users in tenant with daily digest preference
        const preferences = await NotificationPreference.findAll({
          where: {
            tenant_id: tenant.id,
            batch_digest: 'daily',
            email_notifications_enabled: true
          },
          include: [{
            model: User,
            attributes: ['id', 'email', 'first_name'],
            required: true
          }],
          raw: false
        });

        for (const preference of preferences) {
          stats.processed++;

          try {
            // Check if current time matches preferred time (if targetTime is provided)
            if (targetTime && preference.preferred_notification_time) {
              const userTime = preference.preferred_notification_time;
              const [userHour, userMin] = userTime.split(':').map(Number);
              const [targetHour, targetMin] = targetTime.split(':').map(Number);
              
              if (userHour !== targetHour || userMin !== targetMin) {
                stats.skipped++;
                continue;
              }
            }

            const summaryData = await generateSummaryData(preference.User, tenant);
            const sent = await sendDailySummaryEmail(preference.User, tenant, summaryData);
            
            if (sent) {
              stats.sent++;
            } else {
              stats.failed++;
            }
          } catch (error) {
            stats.failed++;
            stats.errors.push(`User ${preference.User.id}: ${error.message}`);
            console.error(`Error processing summary for user ${preference.User.id}:`, error);
          }
        }
      } catch (error) {
        stats.errors.push(`Tenant ${tenant.id}: ${error.message}`);
        console.error(`Error processing tenant ${tenant.id}:`, error);
      }
    }

    console.log(`Daily summaries processed: ${JSON.stringify(stats)}`);
    return stats;
  } catch (error) {
    console.error('Error in processDailySummaries:', error);
    stats.errors.push(`Fatal error: ${error.message}`);
    return stats;
  }
}

/**
 * Process weekly summaries (runs once per week)
 * @returns {Promise<Object>} Statistics about emails sent
 */
async function processWeeklySummaries() {
  const stats = {
    processed: 0,
    sent: 0,
    failed: 0,
    errors: []
  };

  try {
    // Get all active tenants
    const tenants = await Tenant.findAll({
      where: { active: true },
      raw: true
    });

    for (const tenant of tenants) {
      try {
        // Get users with weekly digest preference
        const preferences = await NotificationPreference.findAll({
          where: {
            tenant_id: tenant.id,
            batch_digest: 'weekly',
            email_notifications_enabled: true
          },
          include: [{
            model: User,
            attributes: ['id', 'email', 'first_name'],
            required: true
          }],
          raw: false
        });

        for (const preference of preferences) {
          stats.processed++;
          
          try {
            const summaryData = await generateSummaryData(preference.User, tenant);
            const sent = await sendDailySummaryEmail(preference.User, tenant, summaryData);
            
            if (sent) {
              stats.sent++;
            } else {
              stats.failed++;
            }
          } catch (error) {
            stats.failed++;
            stats.errors.push(`User ${preference.User.id}: ${error.message}`);
          }
        }
      } catch (error) {
        stats.errors.push(`Tenant ${tenant.id}: ${error.message}`);
      }
    }

    console.log(`Weekly summaries processed: ${JSON.stringify(stats)}`);
    return stats;
  } catch (error) {
    console.error('Error in processWeeklySummaries:', error);
    stats.errors.push(`Fatal error: ${error.message}`);
    return stats;
  }
}

module.exports = {
  generateSummaryData,
  sendDailySummaryEmail,
  processDailySummaries,
  processWeeklySummaries
};
