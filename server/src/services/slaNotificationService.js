const { Op } = require('sequelize');
const { Notification, Claim, Tenant, UserTenant } = require('../models');

const SLA_DAYS = 15;
const SLA_WARNING_DAYS = 2;

const shouldNotifyClaim = (claim) => !claim.resolved;

const buildNotificationDescription = (claim) => `SLA en riesgo: ${claim.code}`;

async function processSlaNotifications() {
  const tenants = await Tenant.findAll({ where: { active: true }, raw: true });
  const now = new Date();
  const warningThreshold = new Date(now);
  warningThreshold.setDate(now.getDate() - (SLA_DAYS - SLA_WARNING_DAYS));

  for (const tenant of tenants) {
    const claims = await Claim.findAll({
      where: {
        tenant_id: tenant.id,
        resolved: false,
        creation_date: { [Op.lte]: warningThreshold }
      },
      attributes: ['id', 'code', 'assigned_user', 'creation_date', 'resolved'],
      raw: true
    });

    if (!claims.length) {
      continue;
    }

    const adminMembers = await UserTenant.findAll({
      where: {
        tenant_id: tenant.id,
        role: { [Op.in]: ['owner', 'admin'] }
      },
      attributes: ['user_id'],
      raw: true
    });

    const adminUserIds = adminMembers.map((member) => member.user_id);
    const notificationsToCreate = [];

    for (const claim of claims) {
      if (!shouldNotifyClaim(claim)) {
        continue;
      }

      const recipients = claim.assigned_user ? [claim.assigned_user] : adminUserIds;
      if (!recipients.length) {
        continue;
      }

      const description = buildNotificationDescription(claim);

      for (const userId of recipients) {
        const recentlyNotified = await Notification.findOne({
          where: {
            tenant_id: tenant.id,
            user_id: userId,
            title: 'SLA en riesgo',
            description,
            created_at: { [Op.gte]: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
          },
          attributes: ['id'],
          raw: true
        });

        if (recentlyNotified) {
          continue;
        }

        notificationsToCreate.push({
          tenant_id: tenant.id,
          user_id: userId,
          title: 'SLA en riesgo',
          description,
          type: 'warning'
        });
      }
    }

    if (notificationsToCreate.length) {
      await Notification.bulkCreate(notificationsToCreate);
    }
  }

  return { processedTenants: tenants.length };
}

module.exports = {
  processSlaNotifications
};
