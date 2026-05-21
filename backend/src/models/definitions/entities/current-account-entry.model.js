module.exports = (sequelize, DataTypes) => sequelize.define('CurrentAccountEntry', {
  movementDate: { type: DataTypes.DATEONLY, allowNull: false },
  description: { type: DataTypes.STRING, allowNull: false },
  debit: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  credit: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
}, { tableName: 'current_account_entries' });
