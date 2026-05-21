module.exports = (sequelize, DataTypes) => sequelize.define('MovementDetail', {
  quantity: { type: DataTypes.DECIMAL(14, 3), allowNull: false },
  unitCost: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
}, { tableName: 'movement_details' });
