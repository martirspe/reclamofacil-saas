const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Import models first to avoid initialization issues
const DocumentType = require('./DocumentType');
const Tenant = require('./Tenant');

// Model Definition
const Tutor = sequelize.define('Tutor', {
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
    type: DataTypes.STRING,
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
  }
}, {
  timestamps: true,
  createdAt: 'creation_date',
  updatedAt: 'update_date',
  tableName: 'tutors',
  indexes: [
    {
      fields: ['tenant_id', 'document_number'],
      unique: true,
      name: 'unique_tutor_document_per_tenant'
    },
    {
      fields: ['tenant_id', 'email'],
      unique: true,
      name: 'unique_tutor_email_per_tenant'
    },
    {
      fields: ['tenant_id', 'phone'],
      unique: true,
      name: 'unique_tutor_phone_per_tenant'
    }
  ]
});

// Define associations
DocumentType.hasMany(Tutor, { foreignKey: 'document_type_id' });
Tutor.belongsTo(DocumentType, { foreignKey: 'document_type_id' });

Tenant.hasMany(Tutor, { foreignKey: 'tenant_id' });
Tutor.belongsTo(Tenant, { foreignKey: 'tenant_id' });

module.exports = Tutor;
