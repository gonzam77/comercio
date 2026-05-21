const defineMovementType = require('./entities/movement-type.model');
const defineMovement = require('./entities/movement.model');
const defineMovementDetail = require('./entities/movement-detail.model');
const defineInventory = require('./entities/inventory.model');
const defineKardex = require('./entities/kardex.model');

module.exports = (sequelize, DataTypes) => ({
  MovementType: defineMovementType(sequelize, DataTypes),
  Movement: defineMovement(sequelize, DataTypes),
  MovementDetail: defineMovementDetail(sequelize, DataTypes),
  Inventory: defineInventory(sequelize, DataTypes),
  Kardex: defineKardex(sequelize, DataTypes),
});
