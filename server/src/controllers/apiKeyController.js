/**
 * API Key Controller: CRUD operations for API key management
 * 
 * Manages API key creation, listing, revocation, and usage tracking.
 * API keys are tenant-scoped and support multiple scopes (claims:read, claims:write, etc.)
 */

const { ApiKey } = require('../models');
const { generateApiKey, hashApiKey } = require('../utils/apiKeyUtils');

/**
 * List all API keys for a tenant
 * GET /api/tenants/:slug/api-keys
 */
exports.listApiKeys = async (req, res) => {
  try {
    const keys = await ApiKey.findAll({
      where: { tenant_id: req.tenant.id },
      order: [['creation_date', 'DESC']]
    });

    // Format response (don't expose key_hash)
    const formattedKeys = keys.map(k => ({
      id: k.id,
      label: k.label,
      active: k.active,
      scopes: k.scopes ? k.scopes.split(',').map(s => s.trim()).filter(Boolean) : [],
      creation_date: k.creation_date,
      update_date: k.update_date,
      last_used_at: k.last_used_at
    }));

    res.json(formattedKeys);
  } catch (err) {
    req.log?.error({ err }, 'Error listando API keys');
    res.status(500).json({ message: 'Error listando API keys' });
  }
};

/**
 * Get API key by ID
 * GET /api/tenants/:slug/api-keys/:id
 */
exports.getApiKeyById = async (req, res) => {
  try {
    const { id } = req.params;

    const apiKey = await ApiKey.findOne({
      where: { id, tenant_id: req.tenant.id }
    });

    if (!apiKey) {
      return res.status(404).json({ message: 'API key no encontrada' });
    }

    res.json({
      id: apiKey.id,
      label: apiKey.label,
      active: apiKey.active,
      scopes: apiKey.scopes ? apiKey.scopes.split(',').map(s => s.trim()).filter(Boolean) : [],
      creation_date: apiKey.creation_date,
      update_date: apiKey.update_date,
      last_used_at: apiKey.last_used_at
    });
  } catch (err) {
    req.log?.error({ err }, 'Error obteniendo API key');
    res.status(500).json({ message: 'Error obteniendo API key' });
  }
};

/**
 * Create a new API key
 * POST /api/tenants/:slug/api-keys
 * 
 * Returns the plaintext key ONCE - it won't be retrievable again
 */
exports.createApiKey = async (req, res) => {
  try {
    const { label, scopes } = req.body || {};

    if (!label || !label.trim()) {
      return res.status(400).json({ message: 'El campo "label" es requerido' });
    }

    // Normalize scopes
    const scopesStr = Array.isArray(scopes) 
      ? scopes.join(',') 
      : (scopes || '');

    // Generate API key and hash
    const { key, key_hash } = generateApiKey();

    // Create in database
    const created = await ApiKey.create({
      tenant_id: req.tenant.id,
      label: label.trim(),
      scopes: scopesStr,
      key_hash,
      active: true
    });

    req.log?.info({ api_key_id: created.id, tenant_id: req.tenant.id }, 'API key creada exitosamente');

    // Return plaintext key ONCE
    res.status(201).json({
      id: created.id,
      label: created.label,
      scopes: scopesStr.split(',').map(s => s.trim()).filter(Boolean),
      active: created.active,
      key, // Plaintext - won't be shown again
      message: 'Guarda esta clave de forma segura. No podrás verla de nuevo.'
    });
  } catch (err) {
    req.log?.error({ err }, 'Error creando API key');
    res.status(500).json({ message: 'Error creando API key' });
  }
};

/**
 * Update API key (label and scopes only)
 * PUT /api/tenants/:slug/api-keys/:id
 */
exports.updateApiKey = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, scopes } = req.body;

    const apiKey = await ApiKey.findOne({
      where: { id, tenant_id: req.tenant.id }
    });

    if (!apiKey) {
      return res.status(404).json({ message: 'API key no encontrada' });
    }

    // Update fields
    if (label !== undefined) apiKey.label = label.trim();
    if (scopes !== undefined) {
      apiKey.scopes = Array.isArray(scopes) ? scopes.join(',') : scopes;
    }

    await apiKey.save();

    req.log?.info({ api_key_id: apiKey.id, tenant_id: req.tenant.id }, 'API key actualizada');

    res.json({
      id: apiKey.id,
      label: apiKey.label,
      active: apiKey.active,
      scopes: apiKey.scopes ? apiKey.scopes.split(',').map(s => s.trim()).filter(Boolean) : [],
      message: 'API key actualizada exitosamente'
    });
  } catch (err) {
    req.log?.error({ err }, 'Error actualizando API key');
    res.status(500).json({ message: 'Error actualizando API key' });
  }
};

/**
 * Revoke/deactivate an API key
 * DELETE /api/tenants/:slug/api-keys/:id
 */
exports.revokeApiKey = async (req, res) => {
  try {
    const { id } = req.params;

    const apiKey = await ApiKey.findOne({
      where: { id, tenant_id: req.tenant.id }
    });

    if (!apiKey) {
      return res.status(404).json({ message: 'API key no encontrada' });
    }

    // Soft delete - mark as inactive
    apiKey.active = false;
    await apiKey.save();

    req.log?.info({ api_key_id: apiKey.id, tenant_id: req.tenant.id }, 'API key revocada');

    res.json({ message: 'API key revocada exitosamente' });
  } catch (err) {
    req.log?.error({ err }, 'Error revocando API key');
    res.status(500).json({ message: 'Error revocando API key' });
  }
};

/**
 * Permanently delete an API key
 * DELETE /api/tenants/:slug/api-keys/:id/permanent
 */
exports.deleteApiKey = async (req, res) => {
  try {
    const { id } = req.params;

    const apiKey = await ApiKey.findOne({
      where: { id, tenant_id: req.tenant.id }
    });

    if (!apiKey) {
      return res.status(404).json({ message: 'API key no encontrada' });
    }

    await apiKey.destroy();

    req.log?.info({ api_key_id: id, tenant_id: req.tenant.id }, 'API key eliminada permanentemente');

    res.json({ message: 'API key eliminada permanentemente' });
  } catch (err) {
    req.log?.error({ err }, 'Error eliminando API key');
    res.status(500).json({ message: 'Error eliminando API key' });
  }
};

/**
 * Reactivate a revoked API key
 * POST /api/tenants/:slug/api-keys/:id/activate
 */
exports.activateApiKey = async (req, res) => {
  try {
    const { id } = req.params;

    const apiKey = await ApiKey.findOne({
      where: { id, tenant_id: req.tenant.id }
    });

    if (!apiKey) {
      return res.status(404).json({ message: 'API key no encontrada' });
    }

    apiKey.active = true;
    await apiKey.save();

    req.log?.info({ api_key_id: apiKey.id, tenant_id: req.tenant.id }, 'API key reactivada');

    res.json({
      message: 'API key reactivada exitosamente',
      api_key: {
        id: apiKey.id,
        label: apiKey.label,
        active: apiKey.active
      }
    });
  } catch (err) {
    req.log?.error({ err }, 'Error reactivando API key');
    res.status(500).json({ message: 'Error reactivando API key' });
  }
};

/**
 * Get usage statistics for an API key
 * GET /api/tenants/:slug/api-keys/:id/stats
 */
exports.getApiKeyStats = async (req, res) => {
  try {
    const { id } = req.params;

    const apiKey = await ApiKey.findOne({
      where: { id, tenant_id: req.tenant.id }
    });

    if (!apiKey) {
      return res.status(404).json({ message: 'API key no encontrada' });
    }

    // Calculate days since creation and last use
    const now = new Date();
    const daysSinceCreation = Math.floor((now - apiKey.creation_date) / (1000 * 60 * 60 * 24));
    const daysSinceLastUse = apiKey.last_used_at 
      ? Math.floor((now - apiKey.last_used_at) / (1000 * 60 * 60 * 24))
      : null;

    res.json({
      id: apiKey.id,
      label: apiKey.label,
      active: apiKey.active,
      scopes: apiKey.scopes ? apiKey.scopes.split(',').map(s => s.trim()).filter(Boolean) : [],
      stats: {
        days_since_creation: daysSinceCreation,
        days_since_last_use: daysSinceLastUse,
        last_used_at: apiKey.last_used_at,
        creation_date: apiKey.creation_date,
        is_recently_used: daysSinceLastUse !== null && daysSinceLastUse < 7
      }
    });
  } catch (err) {
    req.log?.error({ err }, 'Error obteniendo estadísticas de API key');
    res.status(500).json({ message: 'Error obteniendo estadísticas' });
  }
};
