const defineSale = require('./entities/sale.model');
const defineSaleDetail = require('./entities/sale-detail.model');
const defineSalePayment = require('./entities/sale-payment.model');

module.exports = (sequelize, DataTypes) => ({
  Sale: defineSale(sequelize, DataTypes),
  SaleDetail: defineSaleDetail(sequelize, DataTypes),
  SalePayment: defineSalePayment(sequelize, DataTypes),
});
