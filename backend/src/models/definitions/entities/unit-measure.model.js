module.exports = (sequelize, DataTypes) => sequelize.define('UnitMeasure', {
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
}, { tableName: 'unit_measures' });
