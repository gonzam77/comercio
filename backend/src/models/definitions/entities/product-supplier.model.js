module.exports = (sequelize, DataTypes) => sequelize.define('ProductSupplier', {
  supplierProductCode: DataTypes.STRING,
}, { tableName: 'product_suppliers' });
