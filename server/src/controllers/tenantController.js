/**
 * Tenant Controller: CRUD operations for tenant management
 * 
 * Manages tenant creation, updates, and retrieval.
 * Each tenant represents an independent organization in the multi-tenant system.
 */

const { Tenant, Subscription, User, UserTenant } = require('../models');
const { sequelize } = require('../config/db');
const { getPlanConfig } = require('../config/planFeatures');

/**
 * Create a new tenant
 * POST /api/tenants
 * 
 * Roles:
 * - Superadmin: Puede crear cualquier tenant (slug, owner_id opcionales)
 * - Admin autenticado: Crea tenant y se auto-asigna como admin
 * 
 * Requires: JWT + email verified (para admin)
 */
exports.createTenant = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // Validate authentication
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Autenticación requerida' });
    }

    const currentUser = await User.findByPk(req.user.id);
    if (!currentUser) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    // Non-superadmin must have verified email
    if (currentUser.role !== 'superadmin' && !currentUser.email_verified) {
      return res.status(403).json({ message: 'Correo electrónico no verificado. Por favor verifica tu correo antes de crear un tenant.' });
    }

    const {
      slug,
      brand_name,
      legal_name,
      tax_id,
      contact_phone,
      address,
      country,
      industry,
      contact_email,
      website,
      primary_color,
      accent_color,
      terms_url,
      privacy_url,
      owner_id // Superadmin can specify owner, otherwise auto-assign to current user
    } = req.body;

    // Normalize slug
    const normalizeSlug = (value) => {
      return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    const normalizedSlug = normalizeSlug(slug);
    if (!normalizedSlug) {
      return res.status(400).json({ message: 'slug es requerido' });
    }

    // Validate required fields
    if (!legal_name || !brand_name || !tax_id || !contact_phone || !address || !country || !industry || !contact_email) {
      return res.status(400).json({
        message: 'slug, legal_name, brand_name, tax_id, contact_phone, address, country, industry y contact_email son requeridos'
      });
    }

    // Check if slug already exists
    const existingTenant = await Tenant.findOne({ where: { slug: normalizedSlug } });
    if (existingTenant) {
      return res.status(400).json({ message: 'El slug ya está en uso' });
    }

    // Determine tenant owner
    let tenantOwnerId = req.user.id; // Default: current user

    // Superadmin can override owner
    if (currentUser.role === 'superadmin' && owner_id) {
      const ownerUser = await User.findByPk(owner_id);
      if (!ownerUser) {
        return res.status(400).json({ message: 'Usuario owner_id no encontrado' });
      }
      tenantOwnerId = owner_id;
    }

    // Create tenant
    const tenant = await Tenant.create({
      slug: normalizedSlug,
      legal_name,
      brand_name,
      tax_id,
      contact_phone,
      address,
      country,
      industry,
      contact_email,
      website,
      primary_color,
      accent_color,
      terms_url,
      privacy_url,
      active: true
    }, { transaction: t });

    // Crear sucursal por defecto (Principal)
    const { Branch } = require('../models');
    const defaultBranch = await Branch.create({
      name: 'Principal',
      address,
      phone: contact_phone,
      active: true,
      tenant_id: tenant.id
    }, { transaction: t });

    // Create default free subscription
    const subscription = await Subscription.create({
      tenant_id: tenant.id,
      plan_name: 'free',
      status: 'active',
      billing_cycle_start: new Date(),
      billing_cycle_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      auto_renew: true
    }, { transaction: t });

    // Auto-assign creator/owner as admin member of the new tenant
    const membership = await UserTenant.create({
      user_id: tenantOwnerId,
      tenant_id: tenant.id,
      role: 'admin'
    }, { transaction: t });

    await t.commit();

    req.log?.info({
      tenant_id: tenant.id,
      slug: normalizedSlug,
      owner_id: tenantOwnerId,
      creator_id: req.user.id,
      creator_role: currentUser.role
    }, 'Tenant creado exitosamente');

    res.status(201).json({
      message: 'Tenant creado exitosamente',
      tenant,
      defaultBranch,
      subscription,
      membership
    });
  } catch (err) {
    await t.rollback();
    req.log?.error({ err }, 'Error creando tenant');
    res.status(500).json({ message: 'Error creando tenant', error: err.message });
  }
};

/**
 * Get all tenants (with pagination)
 * GET /api/tenants
 */
exports.getTenants = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { slug: { [Op.like]: `%${search}%` } },
        { legal_name: { [Op.like]: `%${search}%` } },
        { brand_name: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Tenant.findAndCountAll({
      where,
      include: [
        {
          model: Subscription,
          attributes: ['id', 'plan_name', 'status', 'billing_cycle_end']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['creation_date', 'DESC']]
    });

    res.json({
      tenants: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    req.log?.error({ err }, 'Error obteniendo tenants');
    res.status(500).json({ message: 'Error obteniendo tenants' });
  }
};

/**
 * Get tenant by slug
 * GET /api/tenants/:slug
 */
exports.getTenantBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const tenant = await Tenant.findOne({
      where: { slug },
      include: [
        {
          model: Subscription,
          attributes: ['id', 'plan_name', 'status', 'billing_cycle_start', 'billing_cycle_end', 'auto_renew']
        }
      ]
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant no encontrado' });
    }

    // Get user count via membership table (multi-tenant best practice)
    const userCount = await UserTenant.count({ where: { tenant_id: tenant.id } });

    res.json({
      tenant,
      plan_details: getPlanConfig(tenant.Subscription?.plan_name || 'free'),
      user_count: userCount
    });
  } catch (err) {
    req.log?.error({ err }, 'Error obteniendo tenant');
    res.status(500).json({ message: 'Error obteniendo tenant' });
  }
};

/**
 * Update tenant
 * PUT /api/tenants/:slug
 */
exports.updateTenant = async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      brand_name,
      legal_name,
      tax_id,
      contact_phone,
      address,
      country,
      industry,
      contact_email,
      website,
      primary_color,
      accent_color,
      terms_url,
      privacy_url
    } = req.body;

    const tenant = await Tenant.findOne({ where: { slug } });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant no encontrado' });
    }

    // Update only provided fields (branding + contact)
    if (brand_name !== undefined) tenant.brand_name = brand_name;
    if (legal_name !== undefined) tenant.legal_name = legal_name;
    if (tax_id !== undefined) tenant.tax_id = tax_id;
    if (contact_phone !== undefined) tenant.contact_phone = contact_phone;
    if (address !== undefined) tenant.address = address;
    if (country !== undefined) tenant.country = country;
    if (industry !== undefined) tenant.industry = industry;
    if (contact_email !== undefined) tenant.contact_email = contact_email;
    if (website !== undefined) tenant.website = website;
    if (primary_color !== undefined) tenant.primary_color = primary_color;
    if (accent_color !== undefined) tenant.accent_color = accent_color;
    if (terms_url !== undefined) tenant.terms_url = terms_url;
    if (privacy_url !== undefined) tenant.privacy_url = privacy_url;

    // Handle uploaded assets (optional)
    const filePath = (field) => req.files?.[field]?.[0]?.path;
    const logoLight = filePath('logo_light');
    const logoDark = filePath('logo_dark');
    const favicon = filePath('favicon');

    if (logoLight) tenant.logo_light_url = logoLight;
    if (logoDark) tenant.logo_dark_url = logoDark;
    if (favicon) tenant.favicon_url = favicon;

    await tenant.save();

    req.log?.info({ tenant_id: tenant.id, slug }, 'Tenant actualizado exitosamente');

    res.json({
      message: 'Tenant actualizado exitosamente',
      tenant
    });
  } catch (err) {
    req.log?.error({ err }, 'Error actualizando tenant');
    res.status(500).json({ message: 'Error actualizando tenant' });
  }
};

/**
 * Delete tenant (soft delete - mark as inactive)
 * DELETE /api/tenants/:slug
 */
exports.deleteTenant = async (req, res) => {
  try {
    const { slug } = req.params;

    const tenant = await Tenant.findOne({ where: { slug } });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant no encontrado' });
    }

    // Check if tenant has active users (via memberships)
    const userCount = await UserTenant.count({ where: { tenant_id: tenant.id } });
    if (userCount > 0 && !req.query.force) {
      return res.status(400).json({
        message: `El tenant tiene ${userCount} usuarios activos. Use ?force=true para forzar eliminación.`
      });
    }

    // Cancel subscription
    const subscription = await Subscription.findOne({ where: { tenant_id: tenant.id } });
    if (subscription) {
      subscription.status = 'cancelled';
      subscription.cancelled_at = new Date();
      subscription.cancellation_reason = 'Tenant eliminado';
      await subscription.save();
    }

    // Soft delete: mark as inactive or actually delete
    await tenant.destroy();

    req.log?.info({ tenant_id: tenant.id, slug }, 'Tenant eliminado exitosamente');

    res.json({
      message: 'Tenant eliminado exitosamente',
      tenant_id: tenant.id
    });
  } catch (err) {
    req.log?.error({ err }, 'Error eliminando tenant');
    res.status(500).json({ message: 'Error eliminando tenant' });
  }
};

/**
 * Get tenant statistics
 * GET /api/tenants/:slug/stats
 */
exports.getTenantStats = async (req, res) => {
  try {
    const { slug } = req.params;

    const tenant = await Tenant.findOne({ where: { slug } });
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant no encontrado' });
    }

    const { Claim } = require('../models');
    const Sequelize = require('sequelize');

    // Get stats
    const [userCount, claimCount, thisMonthClaims] = await Promise.all([
      UserTenant.count({ where: { tenant_id: tenant.id } }),
      Claim.count({ where: { tenant_id: tenant.id } }),
      Claim.count({
        where: {
          tenant_id: tenant.id,
          creation_date: {
            [Sequelize.Op.gte]: new Date(new Date().setDate(1))
          }
        }
      })
    ]);

    const subscription = await Subscription.findOne({ where: { tenant_id: tenant.id } });
    const planConfig = getPlanConfig(subscription?.plan_name || 'free');

    res.json({
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        legal_name: tenant.legal_name,
        brand_name: tenant.brand_name,
        tax_id: tenant.tax_id
      },
      subscription: {
        plan: subscription?.plan_name || 'free',
        status: subscription?.status || 'active',
        billing_cycle_end: subscription?.billing_cycle_end
      },
      usage: {
        users: userCount,
        users_limit: planConfig.maxUsers === null ? 'Unlimited' : planConfig.maxUsers,
        claims_total: claimCount,
        claims_this_month: thisMonthClaims,
        claims_limit: planConfig.maxClaims === null ? 'Unlimited' : planConfig.maxClaims
      },
      warnings: {
        users_approaching_limit: typeof planConfig.maxUsers === 'number' && userCount >= (planConfig.maxUsers * 0.8),
        claims_approaching_limit: typeof planConfig.maxClaims === 'number' && thisMonthClaims >= (planConfig.maxClaims * 0.8)
      }
    });
  } catch (err) {
    req.log?.error({ err }, 'Error obteniendo estadísticas del tenant');
    res.status(500).json({ message: 'Error obteniendo estadísticas' });
  }
};
