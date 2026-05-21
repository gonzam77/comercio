module.exports = (sequelize, DataTypes) => sequelize.define('Warehouse', {
  name: { type: DataTypes.STRING, allowNull: false },
}, { tableName: 'warehouses' });
