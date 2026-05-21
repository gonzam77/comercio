module.exports = (sequelize, DataTypes) => sequelize.define('SalePayment', {
  amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
}, { tableName: 'sale_payments' });
