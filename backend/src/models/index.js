const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const ProductImage = require('./ProductImage');
const Transaction = require('./Transaction');
const TransactionItem = require('./TransactionItem');
const Review = require('./Review');

// Associations
Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id' });

User.hasMany(Transaction, { foreignKey: 'user_id' });
Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Transaction.hasMany(TransactionItem, { foreignKey: 'transaction_id', as: 'items' });
TransactionItem.belongsTo(Transaction, { foreignKey: 'transaction_id', as: 'transaction' });
TransactionItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(Review, { foreignKey: 'product_id', as: 'reviews' });
Review.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Review.belongsTo(Transaction, { foreignKey: 'transaction_id', as: 'transaction' });

module.exports = { sequelize, User, Product, ProductImage, Transaction, TransactionItem, Review };
