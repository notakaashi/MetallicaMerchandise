const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TransactionItem = sequelize.define('TransactionItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'transactions', key: 'id' },
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'products', key: 'id' },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Price snapshot at time of purchase',
    },
  }, {
    tableName: 'transaction_items',
    timestamps: true,
  });

  return TransactionItem;
};
