module.exports = (models) => {
  const {
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
  } = models;

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
};
