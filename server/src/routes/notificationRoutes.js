const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { verifyToken } = require('../utils/jwtUtils');
const tenantMiddleware = require('../middlewares/tenantMiddleware');
const membershipMiddleware = require('../middlewares/membershipMiddleware');
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  streamNotifications
} = require('../controllers/notificationController');

const router = express.Router();

router.get('/tenants/:slug/notifications', authMiddleware, tenantMiddleware, membershipMiddleware, getNotifications);
router.patch('/tenants/:slug/notifications/read-all', authMiddleware, tenantMiddleware, membershipMiddleware, markAllNotificationsRead);
router.patch('/tenants/:slug/notifications/:id/read', authMiddleware, tenantMiddleware, membershipMiddleware, markNotificationRead);
router.get('/tenants/:slug/notifications/stream', (req, res, next) => {
  const token = req.query.access_token ? String(req.query.access_token) : '';
  if (!token) {
    return res.status(401).json({ message: 'Token requerido.' });
  }
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(400).json({ message: 'Token inválido.' });
  }
}, tenantMiddleware, membershipMiddleware, streamNotifications);

module.exports = router;
