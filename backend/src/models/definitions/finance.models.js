const defineAccountType = require('./entities/account-type.model');
const defineAccount = require('./entities/account.model');
const definePaymentMethod = require('./entities/payment-method.model');
const defineCashSession = require('./entities/cash-session.model');
const defineCashflow = require('./entities/cashflow.model');
const defineCurrentAccountEntry = require('./entities/current-account-entry.model');

module.exports = (sequelize, DataTypes) => ({
  AccountType: defineAccountType(sequelize, DataTypes),
  Account: defineAccount(sequelize, DataTypes),
  PaymentMethod: definePaymentMethod(sequelize, DataTypes),
  CashSession: defineCashSession(sequelize, DataTypes),
  Cashflow: defineCashflow(sequelize, DataTypes),
  CurrentAccountEntry: defineCurrentAccountEntry(sequelize, DataTypes),
});
