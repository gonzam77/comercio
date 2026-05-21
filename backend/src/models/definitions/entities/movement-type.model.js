module.exports = (sequelize, DataTypes) => sequelize.define('MovementType', {
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  impact: { type: DataTypes.ENUM('IN', 'OUT', 'TRANSFER', 'ADJUST'), allowNull: false },
}, { tableName: 'movement_types' });
