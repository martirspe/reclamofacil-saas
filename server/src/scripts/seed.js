// =============================
// IMPORTS Y DEPENDENCIAS
// =============================
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { connectDB } = require('../config/db');
const { getPlanConfig, PLAN_FEATURES } = require('../config/planFeatures');
const { generateApiKey } = require('../utils/apiKeyUtils');
const { createDefaultPreferences } = require('../utils/notificationPreferenceHelper');
const {
  DocumentType,
  ConsumptionType,
  ClaimType,
  Currency,
  User,
  Tenant,
  UserTenant,
  ApiKey,
  Subscription,
  NotificationPreference,
  Location,
  Branch,
  ComplaintBook
} = require('../models');
const PhoneCountry = require('../models/PhoneCountry');

// =============================
// HELPERS
// =============================
function logSeeded(entity, extra = '') {
  console.log(`Seeded: ${entity}${extra ? ' (' + extra + ')' : ''}`);
}

async function seedPhoneCountries() {
  const count = await PhoneCountry.count();
  if (count > 0) return logSeeded('phone_countries', `${count} existentes`);
  const jsonPath = path.join(__dirname, '../data/phone-countries.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ phone-countries.json no encontrado.');
    return;
  }
  const dataset = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  if (!Array.isArray(dataset) || dataset.length === 0) {
    console.error('❌ Dataset de países vacío');
    return;
  }
  await PhoneCountry.bulkCreate(dataset, {
    validate: true,
    ignoreDuplicates: true,
    updateOnDuplicate: ['name', 'code', 'iso', 'flag']
  });
  logSeeded('phone_countries', `${dataset.length} insertados`);
}

// =============================
// SEED FUNCTIONS
// =============================
async function seedDocumentTypes() {
  if (await DocumentType.count() > 0) return logSeeded('document_types', 'ya existen');
  await DocumentType.bulkCreate([
    { name: 'DNI' },
    { name: 'CARNET DE EXTRANJERIA' },
    { name: 'PASAPORTE' },
    { name: 'BREVETE' }
  ]);
  logSeeded('document_types');
}

async function seedConsumptionTypes() {
  if (await ConsumptionType.count() > 0) return logSeeded('consumption_types', 'ya existen');
  await ConsumptionType.bulkCreate([
    { name: 'Producto' },
    { name: 'Servicio' },
  ]);
  logSeeded('consumption_types');
}

async function seedClaimTypes() {
  if (await ClaimType.count() > 0) return logSeeded('claim_types', 'ya existen');
  await ClaimType.bulkCreate([
    { name: 'Reclamo', description: 'Disconformidad por producto o servicio.' },
    { name: 'Queja', description: 'Disconformidad por atención al público.' },
  ]);
  logSeeded('claim_types');
}

async function seedCurrencies() {
  if (await Currency.count() > 0) return logSeeded('currencies', 'ya existen');
  await Currency.bulkCreate([
    { code: 'PEN', name: 'Sol Peruano', symbol: 'S/.', is_active: true },
    { code: 'USD', name: 'Dólar Estadounidense', symbol: '$', is_active: true },
  ]);
  logSeeded('currencies');
}

async function seedLocations() {
  const count = await Location.count();
  if (count > 0) return logSeeded('locations', `${count} existentes`);
  const jsonPath = path.join(__dirname, '../data/ubigeo.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ ubigeo.json no encontrado. Ejecuta: npm run build:ubigeo');
    return;
  }
  const dataset = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  if (!Array.isArray(dataset) || dataset.length === 0) {
    console.error('❌ Dataset de ubicaciones vacío');
    return;
  }
  await Location.bulkCreate(dataset, {
    validate: true,
    ignoreDuplicates: true,
    updateOnDuplicate: ['district', 'province', 'department', 'active']
  });
  logSeeded('locations', `${await Location.count()} en BD`);
}

async function seedDefaultTenant() {
  const defaultSlug = process.env.TENANT_SLUG || 'default';
  let tenant = await Tenant.findOne({ where: { slug: defaultSlug } });
  if (!tenant) {
    tenant = await Tenant.create({
      slug: defaultSlug,
      legal_name: process.env.TENANT_LEGAL_NAME || 'ReclamoFácil S.A.C.',
      brand_name: process.env.TENANT_BRAND_NAME || 'ReclamoFácil',
      tax_id: process.env.TENANT_TAX_ID || '20123456789',
      contact_phone: process.env.TENANT_CONTACT_PHONE || '+51 999 888 777',
      address: process.env.TENANT_ADDRESS || 'Av. Example 456, Lima, Perú',
      country: process.env.TENANT_COUNTRY || 'Perú',
      industry: process.env.TENANT_INDUSTRY || 'Servicios',
      contact_email: process.env.TENANT_CONTACT_EMAIL || 'hola@reclamofacil.com',
      website: process.env.TENANT_WEBSITE || 'https://reclamofacil.com',
      primary_color: process.env.TENANT_PRIMARY_COLOR || '#2563EB',
      accent_color: process.env.TENANT_ACCENT_COLOR || '#16A34A',
      logo_light_url: process.env.TENANT_LOGO_LIGHT_URL || 'assets/default-tenant/logo-light.png',
      logo_dark_url: process.env.TENANT_LOGO_DARK_URL || 'assets/default-tenant/logo-dark.png',
      favicon_url: process.env.TENANT_FAVICON_URL || 'assets/default-tenant/favicon.png',
      terms_url: process.env.TENANT_TERMS_URL || 'https://reclamofacil.com/terminos',
      privacy_url: process.env.TENANT_PRIVACY_URL || 'https://reclamofacil.com/privacidad',
      active: true
    });
    logSeeded('tenant', defaultSlug);

    // Crear sucursal por defecto
    const branch = await Branch.create({
      name: 'Principal',
      address: tenant.address,
      phone: tenant.contact_phone,
      active: true,
      tenant_id: tenant.id
    });
    logSeeded('branch', branch.name);

    // Crear libro de reclamaciones de ejemplo
    const code = 'DEF-PRI-201-001';
    const complaintBook = await ComplaintBook.create({
      code,
      description: 'Libro de reclamaciones principal',
      active: true,
      tenant_id: tenant.id,
      branch_id: branch.id
    });
    logSeeded('complaint_book', code);
  }
  return tenant;
}

async function seedSuperadminUser(tenant) {
  const defaultEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@example.com';
  const defaultPassword = process.env.SUPERADMIN_PASSWORD || 'superadmin123';
  let user = await User.findOne({ where: { email: defaultEmail } });
  if (!user) {
    const hashed = await bcrypt.hash(defaultPassword, 10);
    user = await User.create({
      first_name: process.env.SUPERADMIN_FIRST_NAME || 'Superadmin',
      last_name: process.env.SUPERADMIN_LAST_NAME || 'User',
      email: defaultEmail,
      password: hashed,
      role: 'superadmin',
    });
    logSeeded('superadmin user', defaultEmail);
  }

  // Asociar superadmin al tenant matriz como owner
  if (tenant && user) {
    await UserTenant.findOrCreate({
      where: { user_id: user.id, tenant_id: tenant.id },
      defaults: { role: 'owner' }
    });
    await seedNotificationPreferences(user, tenant);
  }
  return user;
}

async function seedNotificationPreferences(user, tenant) {
  if (!user || !tenant) return;
  const existing = await NotificationPreference.findOne({ where: { user_id: user.id, tenant_id: tenant.id } });
  if (!existing) {
    await createDefaultPreferences(user.id, tenant.id);
    logSeeded('notification preferences', user.email);
  }
}

async function seedAdminUser(tenant) {
  const defaultEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
  let user = await User.findOne({ where: { email: defaultEmail } });
  if (!user) {
    const hashed = await bcrypt.hash(defaultPassword, 10);
    user = await User.create({
      first_name: process.env.ADMIN_FIRST_NAME || 'Admin',
      last_name: process.env.ADMIN_LAST_NAME || 'User',
      email: defaultEmail,
      password: hashed,
      role: 'admin',
    });
    logSeeded('admin user', defaultEmail);
  }
  // Ensure membership
  if (tenant && user) {
    await UserTenant.findOrCreate({ where: { user_id: user.id, tenant_id: tenant.id }, defaults: { role: 'admin' } });
    await seedNotificationPreferences(user, tenant);
  }
  return user;
}

async function seedApiKey(tenant) {
  if (!tenant) return;
  const subscription = await Subscription.findOne({ where: { tenant_id: tenant.id } });
  const planName = subscription?.plan_name || 'free';
  const planConfig = getPlanConfig(planName);
  if (typeof planConfig.maxApiKeys === 'number' && planConfig.maxApiKeys < 1) {
    console.log(`Skipping API key seed for tenant ${tenant.slug} (plan ${planName} allows 0 keys).`);
    return;
  }
  try {
    const existing = await ApiKey.findOne({ where: { tenant_id: tenant.id } });
    if (existing) {
      logSeeded('api key', `${tenant.slug} (${existing.label})`);
      return;
    }
  } catch (err) {
    console.error('Error checking for existing API key:', err.message);
    return;
  }
  const { key, key_hash } = generateApiKey();
  try {
    await ApiKey.create({
      tenant_id: tenant.id,
      label: 'default-seed',
      scopes: 'claims:read,claims:write',
      key_hash,
      active: true
    });
    logSeeded('api key', `${tenant.slug} (save this key): ${key}`);
  } catch (err) {
    console.error(`Failed to create API key for tenant ${tenant.slug}:`, err.message);
  }
}

async function seedSubscription(tenant) {
  if (!tenant) return;
  const existing = await Subscription.findOne({ where: { tenant_id: tenant.id } });
  if (existing) return logSeeded('subscription', tenant.slug);

  const availablePlans = Object.keys(PLAN_FEATURES);

  // Check if this is the default/master tenant
  const defaultSlug = process.env.TENANT_SLUG || 'default';
  const isMasterTenant = tenant.slug === defaultSlug;

  // Master tenant gets 'master' plan, others get specified plan or 'free'
  let defaultPlan;
  if (isMasterTenant) {
    defaultPlan = 'master';
  } else {
    defaultPlan = process.env.SUBSCRIPTION_PLAN || process.env.DEFAULT_TENANT_PLAN_ON_SEED || 'free';
  }

  if (!availablePlans.includes(defaultPlan)) {
    console.warn(`Plan "${defaultPlan}" not found. Available plans: ${availablePlans.join(', ')}. Using "free".`);
  }
  const planToUse = availablePlans.includes(defaultPlan) ? defaultPlan : 'free';
  const trialYears = parseInt(process.env.SUBSCRIPTION_TRIAL_YEARS || '1', 10);
  const status = process.env.SUBSCRIPTION_STATUS || 'active';
  const autoRenew = (process.env.SUBSCRIPTION_AUTO_RENEW || 'true').toLowerCase() === 'true';
  const now = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + trialYears);
  await Subscription.create({
    tenant_id: tenant.id,
    plan_name: planToUse,
    status: status,
    billing_cycle_start: now,
    billing_cycle_end: endDate,
    auto_renew: autoRenew
  });
  logSeeded('subscription', `${tenant.slug} (plan: ${planToUse}, trial: ${trialYears} año(s))`);
}

// =============================
// EJECUCIÓN PRINCIPAL
// =============================
(async () => {
  try {
    await connectDB();
    await seedDocumentTypes();
    await seedConsumptionTypes();
    await seedClaimTypes();
    await seedCurrencies();
    await seedLocations();
    await seedPhoneCountries();
    const tenant = await seedDefaultTenant();
    await seedSuperadminUser(tenant);
    await seedAdminUser(tenant);
    await seedSubscription(tenant);
    await seedApiKey(tenant);
    console.log('Seeding completed.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
})();
