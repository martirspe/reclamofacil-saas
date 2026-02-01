const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Import models first to avoid initialization issues
const User = require('./User');
const Tenant = require('./Tenant');

// Model Definition
const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Tenant,
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  action: {
    type: DataTypes.ENUM('CREATE', 'READ', 'UPDATE', 'DELETE'),
    allowNull: false
  },
  resource_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  resource_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  old_values: {
    type: DataTypes.JSON,
    allowNull: true
  },
  new_values: {
    type: DataTypes.JSON,
    allowNull: true
  },
  changes: {
    type: DataTypes.JSON,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('success', 'failure'),
    defaultValue: 'success'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // Audit logs are immutable
  tableName: 'audit_logs',
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['user_id'] },
    { fields: ['resource_type', 'resource_id'] },
    { fields: ['action'] },
    { fields: ['created_at'] },
    { fields: ['tenant_id', 'created_at'] } // For tenant audit trails
  ]
});

// Define associations
User.hasMany(AuditLog, { foreignKey: 'user_id' });
AuditLog.belongsTo(User, { foreignKey: 'user_id' });

Tenant.hasMany(AuditLog, { foreignKey: 'tenant_id' });
AuditLog.belongsTo(Tenant, { foreignKey: 'tenant_id' });

module.exports = AuditLog;
