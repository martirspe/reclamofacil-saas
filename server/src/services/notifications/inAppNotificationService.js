const { Op } = require('sequelize');
const { Notification, UserTenant } = require('../../models');

const safeCreate = async (payload) => {
  try {
    if (!Notification) {
      return;
    }
    await Notification.create(payload);
  } catch (error) {
    console.error('Error creando notificacion in-app:', error);
  }
};

const safeBulkCreate = async (payloads) => {
  try {
    if (!Notification || !payloads.length) {
      return;
    }
    await Notification.bulkCreate(payloads);
  } catch (error) {
    console.error('Error creando notificaciones in-app:', error);
  }
};

const buildCustomerName = (customer) => {
  if (customer?.first_name && customer?.last_name) {
    return `${customer.first_name} ${customer.last_name}`;
  }
  return 'Cliente';
};

const resolveAdminUserIds = async (tenantId) => {
  const adminMembers = await UserTenant.findAll({
    where: {
      tenant_id: tenantId,
      role: { [Op.in]: ['owner', 'admin'] }
    },
    attributes: ['user_id'],
    raw: true
  });

  return adminMembers.map((member) => member.user_id);
};

const notifyNewClaim = async ({ tenantId, claim, customer, preferredUserIds = [] }) => {
  const adminUserIds = await resolveAdminUserIds(tenantId);
  const recipientIds = new Set([...adminUserIds, ...preferredUserIds]);
  if (!recipientIds.size) {
    return;
  }

  const customerName = buildCustomerName(customer);
  const payloads = Array.from(recipientIds).map((userId) => ({
    tenant_id: tenantId,
    user_id: userId,
    title: 'Nuevo reclamo',
    description: `${claim.code} registrado por ${customerName}.`,
    type: 'info'
  }));

  await safeBulkCreate(payloads);
};

const notifyClaimAssigned = async ({ tenantId, userId, claim }) => {
  if (!userId) {
    return;
  }

  await safeCreate({
    tenant_id: tenantId,
    user_id: userId,
    title: 'Reclamo asignado',
    description: `${claim.code} asignado a tu bandeja.`,
    type: 'info'
  });
};

const notifyClaimResolved = async ({ tenantId, userId, claim }) => {
  if (!userId) {
    return;
  }

  await safeCreate({
    tenant_id: tenantId,
    user_id: userId,
    title: 'Reclamo resuelto',
    description: `${claim.code} fue marcado como resuelto.`,
    type: 'success'
  });
};

module.exports = {
  notifyNewClaim,
  notifyClaimAssigned,
  notifyClaimResolved
};
