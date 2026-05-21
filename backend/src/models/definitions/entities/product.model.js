module.exports = (sequelize, DataTypes) => sequelize.define('Product', {
  sku: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  costPrice: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  salePrice: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'products' });
