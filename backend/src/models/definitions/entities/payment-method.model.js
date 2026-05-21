module.exports = (sequelize, DataTypes) => sequelize.define('PaymentMethod', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
}, { tableName: 'payment_methods' });
