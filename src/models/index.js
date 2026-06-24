require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'metallica_merch',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    define: {
      underscored: false,
      timestamps: true,
    },
  }
);

// Import models
const User = require('./User')(sequelize);
const Product = require('./Product')(sequelize);
const ProductImage = require('./ProductImage')(sequelize);
const Transaction = require('./Transaction')(sequelize);
const TransactionItem = require('./TransactionItem')(sequelize);

// Associations
User.hasMany(Transaction, { foreignKey: 'user_id', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images', onDelete: 'CASCADE' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Transaction.hasMany(TransactionItem, { foreignKey: 'transaction_id', as: 'items', onDelete: 'CASCADE' });
TransactionItem.belongsTo(Transaction, { foreignKey: 'transaction_id', as: 'transaction' });

TransactionItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(TransactionItem, { foreignKey: 'product_id', as: 'transactionItems' });

module.exports = { sequelize, User, Product, ProductImage, Transaction, TransactionItem };
