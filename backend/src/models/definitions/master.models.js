const defineClient = require('./entities/client.model');
const defineSupplier = require('./entities/supplier.model');
const defineBrand = require('./entities/brand.model');
const defineUnitMeasure = require('./entities/unit-measure.model');
const defineCategory = require('./entities/category.model');
const defineProduct = require('./entities/product.model');
const defineProductSupplier = require('./entities/product-supplier.model');
const defineBranch = require('./entities/branch.model');
const defineWarehouse = require('./entities/warehouse.model');

module.exports = (sequelize, DataTypes) => ({
  Client: defineClient(sequelize, DataTypes),
  Supplier: defineSupplier(sequelize, DataTypes),
  Brand: defineBrand(sequelize, DataTypes),
  UnitMeasure: defineUnitMeasure(sequelize, DataTypes),
  Category: defineCategory(sequelize, DataTypes),
  Product: defineProduct(sequelize, DataTypes),
  ProductSupplier: defineProductSupplier(sequelize, DataTypes),
  Branch: defineBranch(sequelize, DataTypes),
  Warehouse: defineWarehouse(sequelize, DataTypes),
});
