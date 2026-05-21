module.exports = (sequelize, DataTypes) => sequelize.define('Sale', {
  invoiceNumber: DataTypes.STRING,
  saleDate: { type: DataTypes.DATEONLY, allowNull: false },
  total: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
}, { tableName: 'sales' });
