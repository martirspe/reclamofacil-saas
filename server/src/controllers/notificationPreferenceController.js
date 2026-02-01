// Models
const { User, NotificationPreference } = require('../models');

/**
 * Get notification preferences for the current user
 * GET /api/users/me/notification-preferences
 */
exports.getMyPreferences = async (req, res) => {
  try {
    const userId = req.user?.id;
    const tenantId = req.tenant?.id;

    if (!userId || !tenantId) {
      return res.status(400).json({ 
        success: false,
        message: 'Contexto de usuario o tenant requerido' 
      });
    }

    let preferences = await NotificationPreference.findOne({
      where: { user_id: userId, tenant_id: tenantId }
    });

    // Si no existen preferencias, crear con valores por defecto
    if (!preferences) {
      preferences = await NotificationPreference.create({
        user_id: userId,
        tenant_id: tenantId
      });
    }

    res.status(200).json({
      success: true,
      data: preferences,
      message: 'Preferencias de notificación obtenidas correctamente'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener preferencias: ' + error.message 
    });
  }
};

/**
 * Update notification preferences for the current user
 * PUT /api/users/me/notification-preferences
 */
exports.updateMyPreferences = async (req, res) => {
  try {
    const userId = req.user?.id;
    const tenantId = req.tenant?.id;

    if (!userId || !tenantId) {
      return res.status(400).json({ 
        success: false,
        message: 'Contexto de usuario o tenant requerido' 
      });
    }

    // Validación de datos
    const {
      email_notifications_enabled,
      claim_assigned_notification,
      claim_updated_notification,
      claim_resolved_notification,
      daily_summary_notification,
      notification_email,
      preferred_notification_time,
      real_time_critical,
      batch_digest
    } = req.body;

    // Validar email alternativo si se proporciona
    if (notification_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(notification_email)) {
        return res.status(400).json({ 
          success: false,
          message: 'El email alternativo no es válido' 
        });
      }
    }

    // Validar hora preferida si se proporciona
    if (preferred_notification_time) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (!timeRegex.test(preferred_notification_time)) {
        return res.status(400).json({ 
          success: false,
          message: 'Formato de hora inválido (use HH:mm o HH:mm:ss)' 
        });
      }
    }

    // Validar batch_digest
    if (batch_digest && !['immediate', 'daily', 'weekly'].includes(batch_digest)) {
      return res.status(400).json({ 
        success: false,
        message: 'batch_digest debe ser: immediate, daily o weekly' 
      });
    }

    // Obtener o crear preferencias
    let preferences = await NotificationPreference.findOne({
      where: { user_id: userId, tenant_id: tenantId }
    });

    if (!preferences) {
      preferences = await NotificationPreference.create({
        user_id: userId,
        tenant_id: tenantId
      });
    }

    // Actualizar solo los campos proporcionados
    const updateData = {};
    if (email_notifications_enabled !== undefined) updateData.email_notifications_enabled = email_notifications_enabled;
    if (claim_assigned_notification !== undefined) updateData.claim_assigned_notification = claim_assigned_notification;
    if (claim_updated_notification !== undefined) updateData.claim_updated_notification = claim_updated_notification;
    if (claim_resolved_notification !== undefined) updateData.claim_resolved_notification = claim_resolved_notification;
    if (daily_summary_notification !== undefined) updateData.daily_summary_notification = daily_summary_notification;
    if (notification_email !== undefined) updateData.notification_email = notification_email;
    if (preferred_notification_time !== undefined) updateData.preferred_notification_time = preferred_notification_time;
    if (real_time_critical !== undefined) updateData.real_time_critical = real_time_critical;
    if (batch_digest !== undefined) updateData.batch_digest = batch_digest;

    // Aplicar actualizaciones
    await preferences.update(updateData);

    res.status(200).json({
      success: true,
      data: preferences,
      message: 'Preferencias de notificación actualizadas correctamente'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar preferencias: ' + error.message 
    });
  }
};

/**
 * Reset notification preferences to defaults
 * POST /api/users/me/notification-preferences/reset
 */
exports.resetMyPreferences = async (req, res) => {
  try {
    const userId = req.user?.id;
    const tenantId = req.tenant?.id;

    if (!userId || !tenantId) {
      return res.status(400).json({ message: 'Contexto de usuario o tenant requerido' });
    }

    let preferences = await NotificationPreference.findOne({
      where: { user_id: userId, tenant_id: tenantId }
    });

    if (!preferences) {
      preferences = await NotificationPreference.create({
        user_id: userId,
        tenant_id: tenantId
      });
      return res.status(200).json({
        message: 'Preferencias reiniciadas a valores por defecto',
        preferences
      });
    }

    // Reiniciar a valores por defecto
    await preferences.update({
      email_notifications_enabled: true,
      claim_assigned_notification: true,
      claim_updated_notification: true,
      claim_resolved_notification: true,
      daily_summary_notification: false,
      notification_email: null,
      preferred_notification_time: '09:00:00',
      real_time_critical: true,
      batch_digest: 'immediate'
    });

    res.status(200).json({
      message: 'Preferencias reiniciadas a valores por defecto',
      preferences
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al reiniciar preferencias: ' + error.message });
  }
};

/**
 * Get notification preferences for a specific user (Admin or self only)
 * GET /api/notification-preferences/user/:userId
 */
exports.getUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const tenantId = req.tenant?.id;
    const requestingUserId = req.user?.id;
    const userRole = req.userTenant?.role; // Rol en el tenant actual

    if (!userId || !tenantId) {
      return res.status(400).json({ 
        success: false,
        message: 'Parámetros requeridos faltantes' 
      });
    }

    // Validar autorización: solo admins del tenant o el mismo usuario
    if (userId !== String(requestingUserId) && userRole !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'No tienes permiso para ver las preferencias de este usuario' 
      });
    }

    // Verificar que el usuario existe y pertenece al tenant
    const userToCheck = await User.findOne({
      where: { id: userId },
      attributes: ['id', 'first_name', 'last_name', 'email']
    });

    if (!userToCheck) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
    }

    let preferences = await NotificationPreference.findOne({
      where: { user_id: userId, tenant_id: tenantId }
    });

    if (!preferences) {
      preferences = await NotificationPreference.create({
        user_id: userId,
        tenant_id: tenantId
      });
    }

    res.status(200).json({
      success: true,
      data: preferences,
      message: 'Preferencias de notificación obtenidas correctamente'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener preferencias: ' + error.message 
    });
  }
};

/**
 * Update notification preferences for a specific user (Admin or self only)
 * PUT /api/notification-preferences/user/:userId
 */
exports.updateUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const tenantId = req.tenant?.id;
    const requestingUserId = req.user?.id;
    const userRole = req.userTenant?.role; // Rol en el tenant actual

    if (!userId || !tenantId) {
      return res.status(400).json({ 
        success: false,
        message: 'Parámetros requeridos faltantes' 
      });
    }

    // Validar autorización: solo admins del tenant o el mismo usuario
    if (userId !== String(requestingUserId) && userRole !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'No tienes permiso para actualizar las preferencias de este usuario' 
      });
    }

    // Verificar que el usuario existe y pertenece al tenant
    const userToUpdate = await User.findOne({
      where: { id: userId },
      attributes: ['id', 'first_name', 'last_name', 'email']
    });

    if (!userToUpdate) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
    }

    const {
      email_notifications_enabled,
      claim_assigned_notification,
      claim_updated_notification,
      claim_resolved_notification,
      daily_summary_notification,
      notification_email,
      preferred_notification_time,
      real_time_critical,
      batch_digest
    } = req.body;

    // Validaciones
    if (notification_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(notification_email)) {
        return res.status(400).json({ 
          success: false,
          message: 'El email alternativo no es válido' 
        });
      }
    }

    if (preferred_notification_time) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (!timeRegex.test(preferred_notification_time)) {
        return res.status(400).json({ 
          success: false,
          message: 'Formato de hora inválido (use HH:mm o HH:mm:ss)' 
        });
      }
    }

    if (batch_digest && !['immediate', 'daily', 'weekly'].includes(batch_digest)) {
      return res.status(400).json({ 
        success: false,
        message: 'batch_digest debe ser: immediate, daily o weekly' 
      });
    }

    let preferences = await NotificationPreference.findOne({
      where: { user_id: userId, tenant_id: tenantId }
    });

    if (!preferences) {
      preferences = await NotificationPreference.create({
        user_id: userId,
        tenant_id: tenantId
      });
    }

    const updateData = {};
    if (email_notifications_enabled !== undefined) updateData.email_notifications_enabled = email_notifications_enabled;
    if (claim_assigned_notification !== undefined) updateData.claim_assigned_notification = claim_assigned_notification;
    if (claim_updated_notification !== undefined) updateData.claim_updated_notification = claim_updated_notification;
    if (claim_resolved_notification !== undefined) updateData.claim_resolved_notification = claim_resolved_notification;
    if (daily_summary_notification !== undefined) updateData.daily_summary_notification = daily_summary_notification;
    if (notification_email !== undefined) updateData.notification_email = notification_email;
    if (preferred_notification_time !== undefined) updateData.preferred_notification_time = preferred_notification_time;
    if (real_time_critical !== undefined) updateData.real_time_critical = real_time_critical;
    if (batch_digest !== undefined) updateData.batch_digest = batch_digest;

    await preferences.update(updateData);

    res.status(200).json({
      success: true,
      data: preferences,
      message: 'Preferencias de notificación actualizadas correctamente'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar preferencias: ' + error.message 
    });
  }
};

/**
 * List all notification preferences (admin only - tenant scoped)
 * GET /api/notification-preferences
 */
exports.listPreferences = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { page = 1, limit = 10 } = req.query;

    if (!tenantId) {
      return res.status(400).json({ 
        success: false,
        message: 'Contexto de tenant requerido' 
      });
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await NotificationPreference.findAndCountAll({
      where: { tenant_id: tenantId },
      include: [{
        model: User,
        attributes: ['id', 'first_name', 'last_name', 'email', 'role']
      }],
      offset,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      },
      message: `Found ${count} notification preferences`
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener preferencias de notificación: ' + error.message 
    });
  }
};
