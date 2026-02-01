const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Import models first to avoid initialization issues
const User = require('./User');
const Tenant = require('./Tenant');

// Model Definition
const UserTenant = sequelize.define('UserTenant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    unique: 'user_tenant_unique'
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Tenant,
      key: 'id'
    },
    unique: 'user_tenant_unique'
  },
  role: {
    type: DataTypes.ENUM('staff', 'admin', 'owner'),
    allowNull: false,
    defaultValue: 'staff'
  }
}, {
  timestamps: true,
  createdAt: 'creation_date',
  updatedAt: 'update_date',
  tableName: 'user_tenants'
});

// Define associations
User.belongsToMany(Tenant, { through: UserTenant, foreignKey: 'user_id', otherKey: 'tenant_id' });
Tenant.belongsToMany(User, { through: UserTenant, foreignKey: 'tenant_id', otherKey: 'user_id' });

module.exports = UserTenant;
