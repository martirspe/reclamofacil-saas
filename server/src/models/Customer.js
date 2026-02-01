const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Import models first to avoid initialization issues
const Tenant = require('./Tenant');
const DocumentType = require('./DocumentType');

// Model Definition
const Customer = sequelize.define('Customer', {
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
  document_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: DocumentType,
      key: 'id'
    }
  },
  document_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  is_younger: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  person_type: {
    type: DataTypes.ENUM('natural', 'legal'),
    allowNull: false,
    defaultValue: 'natural'
  },
  company_document: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'RUC de la empresa (solo para persona jurídica)'
  },
  company_name: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Razón social (solo para persona jurídica)'
  }
}, {
  timestamps: true,
  createdAt: 'creation_date',
  updatedAt: 'update_date',
  tableName: 'customers',
  indexes: [
    {
      fields: ['tenant_id', 'document_number'],
      unique: true,
      name: 'unique_customer_document_per_tenant'
    },
    {
      fields: ['tenant_id', 'email'],
      unique: true,
      name: 'unique_customer_email_per_tenant'
    },
    {
      fields: ['tenant_id', 'phone'],
      unique: true,
      name: 'unique_customer_phone_per_tenant'
    }
  ]
});

// Define associations
DocumentType.hasMany(Customer, { foreignKey: 'document_type_id' });
Customer.belongsTo(DocumentType, { foreignKey: 'document_type_id' });

Tenant.hasMany(Customer, { foreignKey: 'tenant_id' });
Customer.belongsTo(Tenant, { foreignKey: 'tenant_id' });

module.exports = Customer;
