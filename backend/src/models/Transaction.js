const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    order_number: {
      type: DataTypes.VIRTUAL,
      get() {
        return `ORD-${String(this.id).padStart(3, '0')}`;
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled', 'shipped', 'delivering'),
      defaultValue: 'pending',
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    zip: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    payment_method: {
      type: DataTypes.ENUM('cash', 'card'),
      defaultValue: 'card',
      allowNull: false,
    },
  }, {
    tableName: 'transactions',
    timestamps: true,
  });

module.exports = Transaction;
