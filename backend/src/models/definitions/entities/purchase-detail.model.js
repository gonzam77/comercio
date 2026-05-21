module.exports = (sequelize, DataTypes) => sequelize.define('PurchaseDetail', {
  quantity: { type: DataTypes.DECIMAL(14, 3), allowNull: false },
  unitPrice: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
}, { tableName: 'purchase_details' });
