const express = require('express');
const router = express.Router();
const notificationPreferenceController = require('../controllers/notificationPreferenceController');
const { authMiddleware, tenantMiddleware, membershipMiddleware, requireTenantRole } = require('../middlewares');

/**
 * Notification Preference Routes
 * Rutas para gestionar preferencias de notificación de usuarios
 */

// ===== RUTAS PERSONALES (Usuarios autenticados) =====

/**
 * GET /api/notification-preferences/me
 * Obtener las preferencias de notificación del usuario actual
 */
router.get('/me', authMiddleware, tenantMiddleware, membershipMiddleware, notificationPreferenceController.getMyPreferences);

/**
 * PUT /api/notification-preferences/me
 * Actualizar las preferencias de notificación del usuario actual
 * 
 * Body:
 * {
 *   "email_notifications_enabled": boolean,
 *   "claim_assigned_notification": boolean,
 *   "claim_updated_notification": boolean,
 *   "claim_resolved_notification": boolean,
 *   "daily_summary_notification": boolean,
 *   "notification_email": string (email),
 *   "preferred_notification_time": string (HH:mm o HH:mm:ss),
 *   "real_time_critical": boolean,
 *   "batch_digest": string ('immediate' | 'daily' | 'weekly')
 * }
 */
router.put('/me', authMiddleware, tenantMiddleware, membershipMiddleware, notificationPreferenceController.updateMyPreferences);

/**
 * POST /api/notification-preferences/me/reset
 * Reiniciar las preferencias de notificación del usuario actual a valores por defecto
 */
router.post('/me/reset', authMiddleware, tenantMiddleware, membershipMiddleware, notificationPreferenceController.resetMyPreferences);

// ===== RUTAS ADMINISTRATIVAS =====

/**
 * GET /api/notification-preferences/user/:userId
 * Obtener preferencias de notificación de un usuario específico
 * Solo el admin o el mismo usuario puede verlas
 */
router.get('/user/:userId', authMiddleware, tenantMiddleware, membershipMiddleware, notificationPreferenceController.getUserPreferences);

/**
 * PUT /api/notification-preferences/user/:userId
 * Actualizar preferencias de notificación de un usuario específico
 * Solo el admin o el mismo usuario puede actualizarlas
 */
router.put('/user/:userId', authMiddleware, tenantMiddleware, membershipMiddleware, notificationPreferenceController.updateUserPreferences);

/**
 * GET /api/notification-preferences
 * List all notification preferences (admin only - tenant scoped)
 * Query params: page, limit
 */
router.get('/', authMiddleware, tenantMiddleware, membershipMiddleware, requireTenantRole('admin'), notificationPreferenceController.listPreferences);

module.exports = router;
