module.exports = (sequelize, DataTypes) => sequelize.define('Brand', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
}, { tableName: 'brands' });
