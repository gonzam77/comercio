module.exports = (sequelize, DataTypes) => sequelize.define('Role', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
}, { tableName: 'roles' });
