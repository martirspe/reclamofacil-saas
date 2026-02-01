const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Model Definition
const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  legal_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  brand_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tax_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contact_phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false
  },
  industry: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contact_email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true
  },
  primary_color: {
    type: DataTypes.STRING,
    allowNull: true
  },
  accent_color: {
    type: DataTypes.STRING,
    allowNull: true
  },
  logo_light_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  logo_dark_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  favicon_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  terms_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  privacy_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  timestamps: true,
  createdAt: 'creation_date',
  updatedAt: 'update_date',
  tableName: 'tenants'
});

module.exports = Tenant;
