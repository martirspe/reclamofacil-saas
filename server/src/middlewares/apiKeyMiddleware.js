const { ApiKey, Tenant } = require('../models');
const { hashApiKey } = require('../utils/apiKeyUtils');

// Authenticate via API key (header x-api-key or Authorization: ApiKey <key>), bind req.tenant and req.apiKey
const apiKeyMiddleware = async (req, res, next) => {
  try {
    const headerKey = req.header('x-api-key');
    const authHeader = req.header('authorization');
    const bearerKey = authHeader && authHeader.startsWith('ApiKey ') ? authHeader.slice('ApiKey '.length) : null;
    const rawKey = (headerKey || bearerKey || '').toString().trim();

    if (!rawKey) {
      return res.status(401).json({ message: 'API key requerida' });
    }

    const keyHash = hashApiKey(rawKey);
    const apiKey = await ApiKey.findOne({ where: { key_hash: keyHash, active: true }, include: [{ model: Tenant }] });

    if (!apiKey || !apiKey.Tenant) {
      return res.status(401).json({ message: 'API key inválida o inactiva' });
    }

    req.apiKey = apiKey;
    req.tenant = apiKey.Tenant;
    req.apiKey.last_used_at = new Date();
    apiKey.last_used_at = req.apiKey.last_used_at;
    apiKey.save().catch(() => {});

    // Optionally flag userless auth; downstream can check req.apiKey
    next();
  } catch (err) {
    req.log?.error({ err }, 'Error autenticando API key');
    res.status(500).json({ message: 'Error autenticando API key' });
  }
};

module.exports = apiKeyMiddleware;
