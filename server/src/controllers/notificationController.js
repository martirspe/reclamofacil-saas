const { Notification } = require('../models');
const { Op } = require('sequelize');

const parseLimit = (value, fallback) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, 1), 50);
};

exports.getNotifications = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;
    if (!tenantId || !userId) {
      return res.status(400).json({ message: 'Tenant o usuario no resuelto' });
    }

    const limit = parseLimit(req.query.limit, 10);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const offset = (page - 1) * limit;
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - 30);

    await Notification.destroy({
      where: {
        tenant_id: tenantId,
        user_id: userId,
        created_at: { [Op.lt]: retentionDate }
      }
    });

    const [{ rows, count }, unreadCount] = await Promise.all([
      Notification.findAndCountAll({
        where: { tenant_id: tenantId, user_id: userId },
        order: [['created_at', 'DESC']],
        limit,
        offset
      }),
      Notification.count({
        where: { tenant_id: tenantId, user_id: userId, read_at: null }
      })
    ]);

    return res.status(200).json({
      data: rows,
      unreadCount,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.max(Math.ceil(count / limit), 1)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener notificaciones', error: error.message });
  }
};

exports.streamNotifications = async (req, res) => {
  const tenantId = req.tenant?.id;
  const userId = req.user?.id;
  if (!tenantId || !userId) {
    return res.status(400).json({ message: 'Tenant o usuario no resuelto' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() - 30);
  Notification.destroy({
    where: {
      tenant_id: tenantId,
      user_id: userId,
      created_at: { [Op.lt]: retentionDate }
    }
  }).catch(() => {});

  let lastCreatedAt = new Date();
  const intervalId = setInterval(async () => {
    try {
      const items = await Notification.findAll({
        where: {
          tenant_id: tenantId,
          user_id: userId,
          created_at: { [Op.gt]: lastCreatedAt }
        },
        order: [['created_at', 'ASC']],
        limit: 20
      });

      if (items.length) {
        lastCreatedAt = items[items.length - 1].created_at;
        const unreadCount = await Notification.count({
          where: { tenant_id: tenantId, user_id: userId, read_at: null }
        });
        res.write(`event: notifications\n`);
        res.write(`data: ${JSON.stringify({ items, unreadCount })}\n\n`);
      } else {
        res.write('event: ping\n');
        res.write(`data: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`);
      }
    } catch (error) {
      res.write('event: error\n');
      res.write(`data: ${JSON.stringify({ message: 'Stream error' })}\n\n`);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(intervalId);
  });
};

exports.markNotificationRead = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;
    const id = req.params.id;
    if (!tenantId || !userId) {
      return res.status(400).json({ message: 'Tenant o usuario no resuelto' });
    }

    const notification = await Notification.findOne({
      where: { id, tenant_id: tenantId, user_id: userId }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    if (!notification.read_at) {
      notification.read_at = new Date();
      await notification.save();
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error al marcar notificación', error: error.message });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;
    if (!tenantId || !userId) {
      return res.status(400).json({ message: 'Tenant o usuario no resuelto' });
    }

    await Notification.update(
      { read_at: new Date() },
      { where: { tenant_id: tenantId, user_id: userId, read_at: null } }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error al marcar notificaciones', error: error.message });
  }
};
