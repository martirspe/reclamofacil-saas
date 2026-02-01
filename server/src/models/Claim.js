const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Import models first to avoid initialization issues
const User = require('./User');
const Customer = require('./Customer');
const Tutor = require('./Tutor');
const ConsumptionType = require('./ConsumptionType');
const ClaimType = require('./ClaimType');
const Currency = require('./Currency');
const Tenant = require('./Tenant');
const Location = require('./Location');

// Model Definition
const Claim = sequelize.define('Claim', {
  // Identificación principal
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: Tenant, key: 'id' }
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Customer, key: 'id' }
  },
  tutor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: Tutor, key: 'id' }
  },

  // Catálogos y relaciones
  consumption_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: ConsumptionType, key: 'id' }
  },
  claim_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: ClaimType, key: 'id' }
  },
  currency_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: Currency, key: 'id' }
  },

  // Comprobante de pago
  receipt_type: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Tipo de comprobante (invoice, bill, fee)'
  },
  receipt_number: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Número de comprobante'
  },

  // Ubicación
  location_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'locations', key: 'id' },
    comment: 'Referencia a ubicación (UBIGEO)'
  },
  district: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Nombre del distrito (denormalizado para búsqueda rápida)'
  },
  province: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Nombre de la provincia (denormalizado)'
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Nombre del departamento (denormalizado)'
  },

  // Monto reclamado
  claimed_amount: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },

  // Descripción y detalle
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: { notEmpty: true, len: [100, 3000] }
  },
  detail: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: { notEmpty: true, len: [50, 1000] }
  },
  request: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: { notEmpty: true, len: [50, 1000] }
  },
  address: {
    type: DataTypes.STRING(150),
    allowNull: true,
    validate: { len: [15, 150] }
  },

  // Archivos
  attachment: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Ruta del archivo adjunto en el servidor'
  },
  attachment_original_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Nombre original del archivo tal como lo cargó el cliente'
  },

  // Asignación y respuesta
  assigned_user: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: User, key: 'id' },
  },
  response: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  response_attachment: {
    type: DataTypes.STRING,
    allowNull: true
  },
  assignment_date: {
    type: DataTypes.DATE,
  },
  response_date: {
    type: DataTypes.DATE,
  },

  // Estado y fechas
  resolved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1
  },
  creation_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  update_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  createdAt: 'creation_date',
  updatedAt: 'update_date',
  tableName: 'claims'
});

// Define associations
Customer.hasMany(Claim, { foreignKey: 'customer_id' });
Claim.belongsTo(Customer, { foreignKey: 'customer_id' });

Tutor.hasMany(Claim, { foreignKey: 'tutor_id' });
Claim.belongsTo(Tutor, { foreignKey: 'tutor_id' });

ClaimType.hasMany(Claim, { foreignKey: 'claim_type_id' });
Claim.belongsTo(ClaimType, { foreignKey: 'claim_type_id' });

ConsumptionType.hasMany(Claim, { foreignKey: 'consumption_type_id' });
Claim.belongsTo(ConsumptionType, { foreignKey: 'consumption_type_id' });

User.hasMany(Claim, { foreignKey: 'assigned_user', as: 'assignedClaims' });
Claim.belongsTo(User, { foreignKey: 'assigned_user', as: 'assignedUser' });

Currency.hasMany(Claim, { foreignKey: 'currency_id' });
Claim.belongsTo(Currency, { foreignKey: 'currency_id' });

Tenant.hasMany(Claim, { foreignKey: 'tenant_id' });
Claim.belongsTo(Tenant, { foreignKey: 'tenant_id' });

module.exports = Claim;

Location.hasMany(Claim, { foreignKey: 'location_id' });
Claim.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });
