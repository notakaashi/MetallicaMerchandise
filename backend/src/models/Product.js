const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    category: {
      type: DataTypes.ENUM('shirts', 'hoodies', 'posters', 'accessories', 'vinyl', 'other'),
      defaultValue: 'other',
    },
  }, {
    tableName: 'products',
    timestamps: true,
    paranoid: true,
  });

module.exports = Product;
