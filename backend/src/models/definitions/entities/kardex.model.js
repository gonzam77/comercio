module.exports = (sequelize, DataTypes) => sequelize.define('Kardex', {
  movementDate: { type: DataTypes.DATEONLY, allowNull: false },
  quantityIn: { type: DataTypes.DECIMAL(14, 3), defaultValue: 0 },
  quantityOut: { type: DataTypes.DECIMAL(14, 3), defaultValue: 0 },
  balanceQty: { type: DataTypes.DECIMAL(14, 3), allowNull: false },
  unitCost: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
}, { tableName: 'kardex' });
