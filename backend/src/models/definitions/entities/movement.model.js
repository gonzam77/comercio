module.exports = (sequelize, DataTypes) => sequelize.define('Movement', {
  docNumber: DataTypes.STRING,
  notes: DataTypes.STRING,
  movementDate: { type: DataTypes.DATEONLY, allowNull: false },
}, { tableName: 'movements' });
