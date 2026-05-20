const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'users' });

const Role = sequelize.define('Role', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
}, { tableName: 'roles' });

const UserRole = sequelize.define('UserRole', {}, { tableName: 'user_roles' });

const Client = sequelize.define('Client', {
  fullName: { type: DataTypes.STRING, allowNull: false },
  taxId: { type: DataTypes.STRING, unique: true },
  phone: DataTypes.STRING,
  address: DataTypes.STRING,
}, { tableName: 'clients' });

const Supplier = sequelize.define('Supplier', {
  businessName: { type: DataTypes.STRING, allowNull: false },
  taxId: { type: DataTypes.STRING, unique: true },
  phone: DataTypes.STRING,
  address: DataTypes.STRING,
}, { tableName: 'suppliers' });

const Brand = sequelize.define('Brand', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
}, { tableName: 'brands' });

const UnitMeasure = sequelize.define('UnitMeasure', {
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
}, { tableName: 'unit_measures' });

const Category = sequelize.define('Category', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
}, { tableName: 'categories' });

const Product = sequelize.define('Product', {
  sku: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  costPrice: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  salePrice: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'products' });

const ProductSupplier = sequelize.define('ProductSupplier', {
  supplierProductCode: DataTypes.STRING,
}, { tableName: 'product_suppliers' });

const Branch = sequelize.define('Branch', {
  name: { type: DataTypes.STRING, allowNull: false },
  address: DataTypes.STRING,
}, { tableName: 'branches' });

const Warehouse = sequelize.define('Warehouse', {
  name: { type: DataTypes.STRING, allowNull: false },
}, { tableName: 'warehouses' });

const MovementType = sequelize.define('MovementType', {
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  impact: { type: DataTypes.ENUM('IN', 'OUT', 'TRANSFER', 'ADJUST'), allowNull: false },
}, { tableName: 'movement_types' });

const Movement = sequelize.define('Movement', {
  docNumber: DataTypes.STRING,
  notes: DataTypes.STRING,
  movementDate: { type: DataTypes.DATEONLY, allowNull: false },
}, { tableName: 'movements' });

const MovementDetail = sequelize.define('MovementDetail', {
  quantity: { type: DataTypes.DECIMAL(14, 3), allowNull: false },
  unitCost: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
}, { tableName: 'movement_details' });

const Inventory = sequelize.define('Inventory', {
  stock: { type: DataTypes.DECIMAL(14, 3), allowNull: false, defaultValue: 0 },
}, {
  tableName: 'inventories',
  indexes: [{ unique: true, fields: ['productId', 'warehouseId'] }],
});

const Kardex = sequelize.define('Kardex', {
  movementDate: { type: DataTypes.DATEONLY, allowNull: false },
  quantityIn: { type: DataTypes.DECIMAL(14, 3), defaultValue: 0 },
  quantityOut: { type: DataTypes.DECIMAL(14, 3), defaultValue: 0 },
  balanceQty: { type: DataTypes.DECIMAL(14, 3), allowNull: false },
  unitCost: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
}, { tableName: 'kardex' });

const Purchase = sequelize.define('Purchase', {
  invoiceNumber: DataTypes.STRING,
  purchaseDate: { type: DataTypes.DATEONLY, allowNull: false },
  total: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  paymentMethodId: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'purchases' });

const PurchaseDetail = sequelize.define('PurchaseDetail', {
  quantity: { type: DataTypes.DECIMAL(14, 3), allowNull: false },
  unitPrice: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
}, { tableName: 'purchase_details' });

const Sale = sequelize.define('Sale', {
  invoiceNumber: DataTypes.STRING,
  saleDate: { type: DataTypes.DATEONLY, allowNull: false },
  total: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
}, { tableName: 'sales' });

const SaleDetail = sequelize.define('SaleDetail', {
  quantity: { type: DataTypes.DECIMAL(14, 3), allowNull: false },
  unitPrice: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
}, { tableName: 'sale_details' });

const AccountType = sequelize.define('AccountType', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
}, { tableName: 'account_types' });

const Account = sequelize.define('Account', {
  name: { type: DataTypes.STRING, allowNull: false },
  currentBalance: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
}, { tableName: 'accounts' });

const PaymentMethod = sequelize.define('PaymentMethod', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
}, { tableName: 'payment_methods' });

const SalePayment = sequelize.define('SalePayment', {
  amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
}, { tableName: 'sale_payments' });

const CashSession = sequelize.define('CashSession', {
  openedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  openingAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  closedAt: { type: DataTypes.DATE, allowNull: true },
  closingAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
  expectedClosingAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
  closingDifferenceAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
  status: { type: DataTypes.ENUM('OPEN', 'CLOSED'), allowNull: false, defaultValue: 'OPEN' },
}, { tableName: 'cash_sessions' });

const Cashflow = sequelize.define('Cashflow', {
  movementDate: { type: DataTypes.DATEONLY, allowNull: false },
  movementAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  concept: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
  type: { type: DataTypes.ENUM('PAYMENT', 'COLLECTION'), allowNull: false },
}, { tableName: 'cashflows' });

const CurrentAccountEntry = sequelize.define('CurrentAccountEntry', {
  movementDate: { type: DataTypes.DATEONLY, allowNull: false },
  description: { type: DataTypes.STRING, allowNull: false },
  debit: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  credit: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
}, { tableName: 'current_account_entries' });

User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId' });

Brand.hasMany(Product, { foreignKey: 'brandId' });
Product.belongsTo(Brand, { foreignKey: 'brandId' });
UnitMeasure.hasMany(Product, { foreignKey: 'unitMeasureId' });
Product.belongsTo(UnitMeasure, { foreignKey: 'unitMeasureId' });
Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

Product.belongsToMany(Supplier, { through: ProductSupplier, foreignKey: 'productId' });
Supplier.belongsToMany(Product, { through: ProductSupplier, foreignKey: 'supplierId' });

Branch.hasMany(Warehouse, { foreignKey: 'branchId' });
Warehouse.belongsTo(Branch, { foreignKey: 'branchId' });

MovementType.hasMany(Movement, { foreignKey: 'movementTypeId' });
Movement.belongsTo(MovementType, { foreignKey: 'movementTypeId' });
User.hasMany(Movement, { foreignKey: 'userId' });
Movement.belongsTo(User, { foreignKey: 'userId' });
Warehouse.hasMany(Movement, { foreignKey: 'warehouseFromId', as: 'movementsFrom' });
Warehouse.hasMany(Movement, { foreignKey: 'warehouseToId', as: 'movementsTo' });
Movement.belongsTo(Warehouse, { foreignKey: 'warehouseFromId', as: 'warehouseFrom' });
Movement.belongsTo(Warehouse, { foreignKey: 'warehouseToId', as: 'warehouseTo' });

Movement.hasMany(MovementDetail, { foreignKey: 'movementId' });
MovementDetail.belongsTo(Movement, { foreignKey: 'movementId' });
Product.hasMany(MovementDetail, { foreignKey: 'productId' });
MovementDetail.belongsTo(Product, { foreignKey: 'productId' });

Product.hasMany(Inventory, { foreignKey: 'productId' });
Warehouse.hasMany(Inventory, { foreignKey: 'warehouseId' });
Inventory.belongsTo(Product, { foreignKey: 'productId' });
Inventory.belongsTo(Warehouse, { foreignKey: 'warehouseId' });

Movement.hasMany(Kardex, { foreignKey: 'movementId' });
Kardex.belongsTo(Movement, { foreignKey: 'movementId' });
Product.hasMany(Kardex, { foreignKey: 'productId' });
Warehouse.hasMany(Kardex, { foreignKey: 'warehouseId' });
Kardex.belongsTo(Product, { foreignKey: 'productId' });
Kardex.belongsTo(Warehouse, { foreignKey: 'warehouseId' });

Supplier.hasMany(Purchase, { foreignKey: 'supplierId' });
Purchase.belongsTo(Supplier, { foreignKey: 'supplierId' });
Warehouse.hasMany(Purchase, { foreignKey: 'warehouseId' });
Purchase.belongsTo(Warehouse, { foreignKey: 'warehouseId' });
Purchase.belongsTo(User, { foreignKey: 'userId' });
Purchase.belongsTo(Movement, { foreignKey: 'movementId' });
Purchase.hasMany(PurchaseDetail, { foreignKey: 'purchaseId' });
PurchaseDetail.belongsTo(Purchase, { foreignKey: 'purchaseId' });
PurchaseDetail.belongsTo(Product, { foreignKey: 'productId' });
PaymentMethod.hasMany(Purchase, { foreignKey: 'paymentMethodId' });
Purchase.belongsTo(PaymentMethod, { foreignKey: 'paymentMethodId' });

Client.hasMany(Sale, { foreignKey: 'clientId' });
Sale.belongsTo(Client, { foreignKey: 'clientId' });
Warehouse.hasMany(Sale, { foreignKey: 'warehouseId' });
Sale.belongsTo(Warehouse, { foreignKey: 'warehouseId' });
Sale.belongsTo(User, { foreignKey: 'userId' });
Sale.belongsTo(Movement, { foreignKey: 'movementId' });
Sale.hasMany(SaleDetail, { foreignKey: 'saleId' });
SaleDetail.belongsTo(Sale, { foreignKey: 'saleId' });
SaleDetail.belongsTo(Product, { foreignKey: 'productId' });

PaymentMethod.hasMany(SalePayment, { foreignKey: 'paymentMethodId' });
SalePayment.belongsTo(PaymentMethod, { foreignKey: 'paymentMethodId' });
Sale.hasMany(SalePayment, { foreignKey: 'saleId' });
SalePayment.belongsTo(Sale, { foreignKey: 'saleId' });
User.hasMany(CashSession, { foreignKey: 'userId' });
CashSession.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Cashflow, { foreignKey: 'userId' });
Cashflow.belongsTo(User, { foreignKey: 'userId' });
CashSession.hasMany(Cashflow, { foreignKey: 'cashSessionId' });
Cashflow.belongsTo(CashSession, { foreignKey: 'cashSessionId' });

AccountType.hasMany(Account, { foreignKey: 'accountTypeId' });
Account.belongsTo(AccountType, { foreignKey: 'accountTypeId' });
Account.hasMany(Cashflow, { foreignKey: 'accountId' });
Cashflow.belongsTo(Account, { foreignKey: 'accountId' });
PaymentMethod.hasMany(Cashflow, { foreignKey: 'paymentMethodId' });
Cashflow.belongsTo(PaymentMethod, { foreignKey: 'paymentMethodId' });

Client.hasMany(CurrentAccountEntry, { foreignKey: 'clientId' });
Supplier.hasMany(CurrentAccountEntry, { foreignKey: 'supplierId' });
Sale.hasMany(CurrentAccountEntry, { foreignKey: 'saleId' });
Purchase.hasMany(CurrentAccountEntry, { foreignKey: 'purchaseId' });
CurrentAccountEntry.belongsTo(Client, { foreignKey: 'clientId' });
CurrentAccountEntry.belongsTo(Supplier, { foreignKey: 'supplierId' });
CurrentAccountEntry.belongsTo(Sale, { foreignKey: 'saleId' });
CurrentAccountEntry.belongsTo(Purchase, { foreignKey: 'purchaseId' });

module.exports = {
  sequelize,
  User,
  Role,
  UserRole,
  Client,
  Supplier,
  Brand,
  UnitMeasure,
  Category,
  Product,
  ProductSupplier,
  Branch,
  Warehouse,
  MovementType,
  Movement,
  MovementDetail,
  Inventory,
  Kardex,
  Purchase,
  PurchaseDetail,
  Sale,
  SaleDetail,
  AccountType,
  Account,
  PaymentMethod,
  SalePayment,
  CashSession,
  Cashflow,
  CurrentAccountEntry,
};
