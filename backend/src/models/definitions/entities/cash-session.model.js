module.exports = (sequelize, DataTypes) => sequelize.define('CashSession', {
  warehouseId: { type: DataTypes.INTEGER, allowNull: false },
  openedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  openingAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  closedAt: { type: DataTypes.DATE, allowNull: true },
  closingAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
  expectedClosingAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
  closingDifferenceAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
  status: { type: DataTypes.ENUM('OPEN', 'CLOSED'), allowNull: false, defaultValue: 'OPEN' },
}, { tableName: 'cash_sessions' });
