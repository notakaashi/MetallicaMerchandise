const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const ProductImage = require('./ProductImage');
const Transaction = require('./Transaction');
const TransactionItem = require('./TransactionItem');

// Associations
Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id' });

User.hasMany(Transaction, { foreignKey: 'user_id' });
Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Transaction.hasMany(TransactionItem, { foreignKey: 'transaction_id', as: 'items' });
TransactionItem.belongsTo(Transaction, { foreignKey: 'transaction_id' });
TransactionItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

module.exports = { sequelize, User, Product, ProductImage, Transaction, TransactionItem };
