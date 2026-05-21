module.exports = (sequelize, DataTypes) => sequelize.define('Account', {
  name: { type: DataTypes.STRING, allowNull: false },
  currentBalance: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
}, { tableName: 'accounts' });
