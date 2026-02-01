const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Import models first to avoid initialization issues
const Tenant = require('./Tenant');

// Model Definition
const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: Tenant,
      key: 'id'
    }
  },
  plan_name: {
    type: DataTypes.ENUM('free', 'starter', 'pro', 'enterprise', 'master'),
    allowNull: false,
    defaultValue: 'free'
  },
  status: {
    type: DataTypes.ENUM('active', 'paused', 'cancelled', 'expired'),
    allowNull: false,
    defaultValue: 'active'
  },
  billing_cycle_start: {
    type: DataTypes.DATE,
    allowNull: true
  },
  billing_cycle_end: {
    type: DataTypes.DATE,
    allowNull: true
  },
  payment_provider: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  payment_provider_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  auto_renew: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancellation_reason: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'creation_date',
  updatedAt: 'update_date',
  tableName: 'subscriptions'
});

// Define associations
Tenant.hasOne(Subscription, { foreignKey: 'tenant_id', onDelete: 'CASCADE' });
Subscription.belongsTo(Tenant, { foreignKey: 'tenant_id' });

module.exports = Subscription;
