module.exports = (sequelize, DataTypes) => sequelize.define('AccountType', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
}, { tableName: 'account_types' });
