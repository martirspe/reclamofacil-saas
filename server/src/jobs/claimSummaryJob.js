/**
 * Claim Summary Job Scheduler
 * Uses node-schedule to run daily and weekly summary jobs
 * Respects user preferences for notification timing
 */

const schedule = require('node-schedule');
const dailySummaryService = require('../services/dailySummaryService');
const slaNotificationService = require('../services/slaNotificationService');
const { NotificationPreference, User, Tenant } = require('../models');

let scheduledJobs = {};

/**
 * Initialize the summary job scheduler
 * Sets up jobs for daily and weekly summaries
 */
function initializeScheduler() {
  try {
    // Daily summary job - Runs every hour checking if any users have notifications scheduled
    const dailyJob = schedule.scheduleJob('0 * * * *', async () => {
      console.log(`[${new Date().toISOString()}] Running hourly daily summary check...`);
      
      try {
        const currentHour = new Date().getHours();
        const currentMinute = new Date().getMinutes();
        const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`;
        
        const result = await dailySummaryService.processDailySummaries(currentTime);
        
        if (result.sent > 0) {
          console.log(`✓ Daily summaries sent: ${result.sent}/${result.processed}`);
        }
        if (result.failed > 0) {
          console.warn(`⚠ Daily summary failures: ${result.failed}`);
        }
      } catch (error) {
        console.error('Error in daily summary job:', error);
      }
    });

    scheduledJobs.daily = dailyJob;
    console.log('✓ Daily summary scheduler initialized (runs every hour)');

    // Weekly summary job - Runs every Monday at 9:00 AM
    const weeklyJob = schedule.scheduleJob('0 9 * * 1', async () => {
      console.log(`[${new Date().toISOString()}] Running weekly summary job...`);
      
      try {
        const result = await dailySummaryService.processWeeklySummaries();
        
        console.log(`✓ Weekly summaries sent: ${result.sent}/${result.processed}`);
        if (result.failed > 0) {
          console.warn(`⚠ Weekly summary failures: ${result.failed}`);
        }
      } catch (error) {
        console.error('Error in weekly summary job:', error);
      }
    });

    scheduledJobs.weekly = weeklyJob;
    console.log('✓ Weekly summary scheduler initialized (runs every Monday at 09:00)');

    const slaJob = schedule.scheduleJob('15 * * * *', async () => {
      console.log(`[${new Date().toISOString()}] Running SLA notification check...`);

      try {
        await slaNotificationService.processSlaNotifications();
      } catch (error) {
        console.error('Error in SLA notification job:', error);
      }
    });

    scheduledJobs.sla = slaJob;
    console.log('✓ SLA notification scheduler initialized (runs hourly at minute 15)');

  } catch (error) {
    console.error('Error initializing scheduler:', error);
    throw error;
  }
}

/**
 * Stop all scheduled jobs
 */
function stopScheduler() {
  Object.values(scheduledJobs).forEach(job => {
    if (job) {
      job.cancel();
    }
  });
  scheduledJobs = {};
  console.log('✓ All summary scheduler jobs stopped');
}

/**
 * Get scheduler status
 */
function getSchedulerStatus() {
  return {
    isRunning: Object.keys(scheduledJobs).length > 0,
    jobs: Object.keys(scheduledJobs),
    totalJobs: Object.keys(scheduledJobs).length
  };
}

/**
 * Manually trigger daily summaries (for testing/admin purposes)
 * @param {string} tenantId - Optional tenant ID to filter
 * @param {string} userId - Optional user ID to filter
 */
async function triggerDailySummaries(tenantId = null, userId = null) {
  try {
    console.log(`[Manual Trigger] Processing daily summaries...`);
    
    if (userId && tenantId) {
      // Send to specific user
      const user = await User.findByPk(userId);
      const tenant = await Tenant.findByPk(tenantId);
      
      if (!user || !tenant) {
        throw new Error('User or tenant not found');
      }

      const summaryData = await dailySummaryService.generateSummaryData(user, tenant);
      const sent = await dailySummaryService.sendDailySummaryEmail(user, tenant, summaryData);
      
      return { sent: sent ? 1 : 0, failed: sent ? 0 : 1 };
    } else if (tenantId) {
      // Send to all users in tenant
      const result = await dailySummaryService.processDailySummaries();
      return result;
    } else {
      // Send to all users
      const result = await dailySummaryService.processDailySummaries();
      return result;
    }
  } catch (error) {
    console.error('Error in triggerDailySummaries:', error);
    return { sent: 0, failed: 1, errors: [error.message] };
  }
}

/**
 * Manually trigger weekly summaries (for testing/admin purposes)
 */
async function triggerWeeklySummaries() {
  try {
    console.log(`[Manual Trigger] Processing weekly summaries...`);
    const result = await dailySummaryService.processWeeklySummaries();
    return result;
  } catch (error) {
    console.error('Error in triggerWeeklySummaries:', error);
    return { sent: 0, failed: 0, errors: [error.message] };
  }
}

module.exports = {
  initializeScheduler,
  stopScheduler,
  getSchedulerStatus,
  triggerDailySummaries,
  triggerWeeklySummaries
};
