const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const defineAuthModels = require('./definitions/auth.models');
const defineMasterModels = require('./definitions/master.models');
const defineInventoryModels = require('./definitions/inventory.models');
const definePurchaseModels = require('./definitions/purchase.models');
const defineSaleModels = require('./definitions/sale.models');
const defineFinanceModels = require('./definitions/finance.models');
const applyAssociations = require('./associations');

const models = {
  sequelize,
  ...defineAuthModels(sequelize, DataTypes),
  ...defineMasterModels(sequelize, DataTypes),
  ...defineInventoryModels(sequelize, DataTypes),
  ...definePurchaseModels(sequelize, DataTypes),
  ...defineSaleModels(sequelize, DataTypes),
  ...defineFinanceModels(sequelize, DataTypes),
};

applyAssociations(models);

module.exports = models;
