const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Model Definition
const ClaimType = sequelize.define('ClaimType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'claim_types'
});

module.exports = ClaimType;
