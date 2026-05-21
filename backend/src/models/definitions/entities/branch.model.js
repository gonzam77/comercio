module.exports = (sequelize, DataTypes) => sequelize.define('Branch', {
  name: { type: DataTypes.STRING, allowNull: false },
  address: DataTypes.STRING,
}, { tableName: 'branches' });
