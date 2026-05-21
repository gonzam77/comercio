module.exports = (sequelize, DataTypes) => sequelize.define('Inventory', {
  stock: { type: DataTypes.DECIMAL(14, 3), allowNull: false, defaultValue: 0 },
}, {
  tableName: 'inventories',
  indexes: [{ unique: true, fields: ['productId', 'warehouseId'] }],
});
