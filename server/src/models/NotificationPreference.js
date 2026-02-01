const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Import models first to avoid initialization issues
const User = require('./User');
const Tenant = require('./Tenant');

// Model Definition
const NotificationPreference = sequelize.define('NotificationPreference', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  email_notifications_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  claim_assigned_notification: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  claim_updated_notification: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  claim_resolved_notification: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  daily_summary_notification: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  notification_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  preferred_notification_time: {
    type: DataTypes.TIME,
    defaultValue: '09:00:00',
  },
  real_time_critical: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  batch_digest: {
    type: DataTypes.ENUM('immediate', 'daily', 'weekly'),
    defaultValue: 'immediate',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
},
  {
    tableName: 'notification_preferences',
    timestamps: false,
    indexes: [
      {
        fields: ['user_id', 'tenant_id'],
        unique: true,
      },
      {
        fields: ['tenant_id'],
      },
    ],
  }
);

// Define associations
User.hasMany(NotificationPreference, { foreignKey: 'user_id' });
NotificationPreference.belongsTo(User, { foreignKey: 'user_id' });

Tenant.hasMany(NotificationPreference, { foreignKey: 'tenant_id' });
NotificationPreference.belongsTo(Tenant, { foreignKey: 'tenant_id' });

module.exports = NotificationPreference;
