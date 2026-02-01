const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Import models first to avoid initialization issues
const Tenant = require('./Tenant');

// Model Definition
const ApiKey = sequelize.define('ApiKey', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Tenant,
      key: 'id'
    }
  },
  label: {
    type: DataTypes.STRING,
    allowNull: true
  },
  key_hash: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  scopes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_used_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  createdAt: 'creation_date',
  updatedAt: 'update_date',
  tableName: 'api_keys'
});

// Define associations
Tenant.hasMany(ApiKey, { foreignKey: 'tenant_id' });
ApiKey.belongsTo(Tenant, { foreignKey: 'tenant_id' });

module.exports = ApiKey;
