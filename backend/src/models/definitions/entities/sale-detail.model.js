module.exports = (sequelize, DataTypes) => sequelize.define('SaleDetail', {
  quantity: { type: DataTypes.DECIMAL(14, 3), allowNull: false },
  unitPrice: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
}, { tableName: 'sale_details' });
