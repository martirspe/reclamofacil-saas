const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PhoneCountry = sequelize.define('PhoneCountry', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  iso: {
    type: DataTypes.STRING,
    allowNull: false
  },
  flag: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'creation_date',
  updatedAt: 'update_date',
  tableName: 'phone_countries'
});

module.exports = PhoneCountry;