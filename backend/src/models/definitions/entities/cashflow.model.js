module.exports = (sequelize, DataTypes) => sequelize.define('Cashflow', {
  movementDate: { type: DataTypes.DATEONLY, allowNull: false },
  movementAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  concept: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
  type: { type: DataTypes.ENUM('PAYMENT', 'COLLECTION'), allowNull: false },
}, { tableName: 'cashflows' });
