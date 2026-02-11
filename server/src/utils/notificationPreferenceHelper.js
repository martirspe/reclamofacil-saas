const { NotificationPreference, User, UserTenant } = require('../models');

/**
 * Verifica si un usuario debe recibir una notificación específica
 * @param {number} userId - ID del usuario
 * @param {number} tenantId - ID del tenant
 * @param {string} notificationType - Tipo de notificación: 'assigned' | 'updated' | 'resolved' | 'summary'
 * @returns {Promise<boolean>} - true si debe recibir notificación
 */
exports.shouldSendNotification = async (userId, tenantId, notificationType) => {
  try {
    const preference = await NotificationPreference.findOne({
      where: { user_id: userId, tenant_id: tenantId }
    });

    // Si no hay preferencias, usar valores por defecto (enviar)
    if (!preference) {
      return true;
    }

    // Master toggle
    if (!preference.email_notifications_enabled) {
      return false;
    }

    // Verificar notificación específica
    switch (notificationType) {
      case 'assigned':
        return preference.claim_assigned_notification;
      case 'updated':
        return preference.claim_updated_notification;
      case 'resolved':
        return preference.claim_resolved_notification;
      case 'summary':
        return preference.daily_summary_notification;
      default:
        return true;
    }
  } catch (error) {
    console.error('Error checking notification preference:', error);
    // Por defecto, enviar notificación si hay error
    return true;
  }
};

/**
 * Obtiene el email correcto para enviar notificación
 * Retorna email alternativo si está configurado, sino email del usuario
 * @param {number} userId - ID del usuario
 * @param {number} tenantId - ID del tenant
 * @param {string} userEmail - Email por defecto del usuario
 * @returns {Promise<string>} - Email a usar para notificación
 */
exports.getNotificationEmail = async (userId, tenantId, userEmail) => {
  try {
    const preference = await NotificationPreference.findOne({
      where: { user_id: userId, tenant_id: tenantId },
      attributes: ['notification_email']
    });

    // Si hay email alternativo configurado, usarlo
    if (preference && preference.notification_email) {
      return preference.notification_email;
    }

    // Si no, usar email del usuario
    return userEmail;
  } catch (error) {
    console.error('Error getting notification email:', error);
    // Por defecto, usar email del usuario
    return userEmail;
  }
};

/**
 * Obtiene las preferencias completas de un usuario
 * @param {number} userId - ID del usuario
 * @param {number} tenantId - ID del tenant
 * @returns {Promise<Object>} - Objeto de preferencias o null
 */
exports.getPreferences = async (userId, tenantId) => {
  try {
    const preference = await NotificationPreference.findOne({
      where: { user_id: userId, tenant_id: tenantId }
    });

    return preference;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return null;
  }
};

/**
 * Verifica si se deben enviar notificaciones en tiempo real
 * vs en batch/digest según preferencias
 * @param {number} userId - ID del usuario
 * @param {number} tenantId - ID del tenant
 * @param {string} notificationType - Tipo de notificación
 * @returns {Promise<Object>} - { sendNow: boolean, frequency: string }
 */
exports.getNotificationTiming = async (userId, tenantId, notificationType) => {
  try {
    const preference = await NotificationPreference.findOne({
      where: { user_id: userId, tenant_id: tenantId },
      attributes: ['real_time_critical', 'batch_digest']
    });

    // Por defecto: en tiempo real e inmediato
    if (!preference) {
      return { sendNow: true, frequency: 'immediate' };
    }

    // Para notificaciones críticas (nuevos reclamos), siempre en tiempo real si está habilitado
    if (notificationType === 'new_claim' && preference.real_time_critical) {
      return { sendNow: true, frequency: 'immediate' };
    }

    // Para otras notificaciones, usar batch_digest
    return {
      sendNow: preference.batch_digest === 'immediate',
      frequency: preference.batch_digest
    };
  } catch (error) {
    console.error('Error getting notification timing:', error);
    return { sendNow: true, frequency: 'immediate' };
  }
};

/**
 * Crea preferencias por defecto para un nuevo usuario
 * @param {number} userId - ID del usuario
 * @param {number} tenantId - ID del tenant
 * @returns {Promise<Object>} - Las preferencias creadas
 */
exports.createDefaultPreferences = async (userId, tenantId) => {
  try {
    const { NotificationPreference } = require('../models');
    
    const preferences = await NotificationPreference.create({
      user_id: userId,
      tenant_id: tenantId
    });

    return preferences;
  } catch (error) {
    console.error('Error creating default notification preferences:', error);
    return null;
  }
};

/**
 * Resuelve el email para notificar a un usuario segun preferencias
 * @param {Object} user - Usuario (debe tener id y email)
 * @param {number} tenantId - ID del tenant
 * @param {string} notificationType - Tipo de notificacion
 * @returns {Promise<string|null>} - Email destino o null si no aplica
 */
exports.resolveUserNotificationEmail = async (user, tenantId, notificationType) => {
  try {
    if (!user?.id || !tenantId) {
      return null;
    }

    const shouldSend = await exports.shouldSendNotification(user.id, tenantId, notificationType);
    if (!shouldSend) {
      return null;
    }

    return await exports.getNotificationEmail(user.id, tenantId, user.email);
  } catch (error) {
    console.error('Error resolving user notification email:', error);
    return null;
  }
};

/**
 * Resuelve el email del contacto del tenant si corresponde a un usuario del tenant
 * @param {Object} tenant - Tenant actual
 * @param {string} notificationType - Tipo de notificacion
 * @returns {Promise<string|null>} - Email destino o null si no aplica
 */
exports.resolveTenantContactNotificationEmail = async (tenant, notificationType) => {
  try {
    const tenantId = tenant?.id;
    const contactEmail = tenant?.contact_email;
    if (!tenantId || !contactEmail) {
      return null;
    }

    const user = await User.findOne({ where: { email: contactEmail } });
    if (!user) {
      return null;
    }

    const membership = await UserTenant.findOne({
      where: { user_id: user.id, tenant_id: tenantId },
      attributes: ['user_id'],
      raw: true
    });

    if (!membership) {
      return null;
    }

    return await exports.resolveUserNotificationEmail(user, tenantId, notificationType);
  } catch (error) {
    console.error('Error resolving tenant contact notification email:', error);
    return null;
  }
};
