module.exports = (sequelize, DataTypes) => sequelize.define('Warehouse', {
  name: { type: DataTypes.STRING, allowNull: false },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'warehouses' });
