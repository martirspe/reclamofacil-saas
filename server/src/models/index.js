
// Sequelize instance
const { sequelize } = require('../config/db');

// Import all models
const User = require('./User');
const Customer = require('./Customer');
const Tutor = require('./Tutor');
const DocumentType = require('./DocumentType');
const ConsumptionType = require('./ConsumptionType');
const ClaimType = require('./ClaimType');
const Currency = require('./Currency');
const Location = require('./Location');
const Claim = require('./Claim');
const Tenant = require('./Tenant');
const UserTenant = require('./UserTenant');
const ApiKey = require('./ApiKey');
const Subscription = require('./Subscription');
const AuditLog = require('./AuditLog');
const NotificationPreference = require('./NotificationPreference');
const Branch = require('./Branch');
const ComplaintBook = require('./ComplaintBook');

// Collect all models
const db = {
  User,
  Customer,
  Tutor,
  DocumentType,
  ConsumptionType,
  ClaimType,
  Currency,
  Location,
  Claim,
  Tenant,
  UserTenant,
  ApiKey,
  Subscription,
  AuditLog,
  NotificationPreference,
  Branch,
  ComplaintBook
};

// Define associations
Branch.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(Branch, { foreignKey: 'tenant_id' });

ComplaintBook.belongsTo(Tenant, { foreignKey: 'tenant_id' });
ComplaintBook.belongsTo(Branch, { foreignKey: 'branch_id' });
Tenant.hasMany(ComplaintBook, { foreignKey: 'tenant_id' });
Branch.hasMany(ComplaintBook, { foreignKey: 'branch_id' });

// Run associations if defined
Object.values(db).forEach(model => {
  if (model.associate) {
    model.associate(db);
  }
});

module.exports = db;
