const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Model Definition
const ConsumptionType = sequelize.define('ConsumptionType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: false,
  tableName: 'consumption_types'
});

module.exports = ConsumptionType;
