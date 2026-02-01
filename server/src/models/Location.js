const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Location = sequelize.define('Location', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ubigeo: {
    type: DataTypes.STRING(6),
    allowNull: false,
    unique: true,
    comment: 'Código INEI UBIGEO de 6 dígitos'
  },
  district: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nombre del distrito'
  },
  province: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nombre de la provincia'
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nombre del departamento/región'
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  displayName: {
    type: DataTypes.VIRTUAL,
    get() {
      return `${this.district} / ${this.province} / ${this.department}`;
    }
  }
}, {
  timestamps: true,
  createdAt: 'creation_date',
  updatedAt: 'update_date',
  tableName: 'locations',
  indexes: [
    { fields: ['ubigeo'] },
    { fields: ['department', 'province', 'district'] },
    { fields: ['active'] }
  ]
});

module.exports = Location;
