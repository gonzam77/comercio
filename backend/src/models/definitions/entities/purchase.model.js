module.exports = (sequelize, DataTypes) => sequelize.define('Purchase', {
  invoiceNumber: DataTypes.STRING,
  purchaseDate: { type: DataTypes.DATEONLY, allowNull: false },
  total: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  paymentMethodId: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'purchases' });
