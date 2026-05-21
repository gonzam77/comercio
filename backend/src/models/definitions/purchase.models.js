const definePurchase = require('./entities/purchase.model');
const definePurchaseDetail = require('./entities/purchase-detail.model');

module.exports = (sequelize, DataTypes) => ({
  Purchase: definePurchase(sequelize, DataTypes),
  PurchaseDetail: definePurchaseDetail(sequelize, DataTypes),
});
