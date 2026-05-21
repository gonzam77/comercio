module.exports = (sequelize, DataTypes) => sequelize.define('Supplier', {
  businessName: { type: DataTypes.STRING, allowNull: false },
  taxId: { type: DataTypes.STRING, unique: true },
  phone: DataTypes.STRING,
  address: DataTypes.STRING,
}, { tableName: 'suppliers' });
