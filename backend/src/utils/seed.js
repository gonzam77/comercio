const bcrypt = require('bcryptjs');
const {
  MovementType,
  Role,
  User,
  Client,
  Supplier,
  Brand,
  UnitMeasure,
  Category,
  Product,
  Branch,
  Warehouse,
  PaymentMethod,
} = require('../models');

async function seedCatalogs() {
  const movementTypes = [
    { code: 'COMPRA', name: 'Compra', impact: 'IN' },
    { code: 'VENTA', name: 'Venta', impact: 'OUT' },
    { code: 'TRANSFERENCIA', name: 'Transferencia', impact: 'TRANSFER' },
    { code: 'AJUSTE', name: 'Ajuste', impact: 'ADJUST' },
  ];

  for (const item of movementTypes) {
    await MovementType.findOrCreate({ where: { code: item.code }, defaults: item });
  }
  const paymentMethods = ['EFECTIVO', 'DEBITO', 'CREDITO', 'CTA CTE'];
  for (const name of paymentMethods) {
    await PaymentMethod.findOrCreate({ where: { name }, defaults: { name } });
  }

  const [adminRole] = await Role.findOrCreate({ where: { name: 'ADMIN' }, defaults: { name: 'ADMIN' } });
  const [sellerRole] = await Role.findOrCreate({ where: { name: 'VENDEDOR' }, defaults: { name: 'VENDEDOR' } });

  const [branch] = await Branch.findOrCreate({
    where: { name: 'Casa Central' },
    defaults: { name: 'Casa Central', address: 'Av. Principal 123' },
  });

  const [warehouse] = await Warehouse.findOrCreate({
    where: { name: 'Deposito Central' },
    defaults: { name: 'Deposito Central', branchId: branch.id, active: true },
  });

  if (!warehouse.branchId) {
    warehouse.branchId = branch.id;
  }
  if (warehouse.active === null || warehouse.active === undefined) {
    warehouse.active = true;
  }
  if (warehouse.changed()) {
    await warehouse.save();
  }

  const [unit] = await UnitMeasure.findOrCreate({
    where: { code: 'UN' },
    defaults: { code: 'UN', name: 'Unidad' },
  });

  const [brand] = await Brand.findOrCreate({
    where: { name: 'Generica' },
    defaults: { name: 'Generica' },
  });

  const [category] = await Category.findOrCreate({
    where: { name: 'General' },
    defaults: { name: 'General' },
  });

  const adminHash = await bcrypt.hash('admin123', 10);
  const sellerHash = await bcrypt.hash('vendedor123', 10);

  const [adminUser] = await User.findOrCreate({
    where: { email: 'admin@comercio.local' },
    defaults: {
      name: 'Administrador',
      email: 'admin@comercio.local',
      password: adminHash,
      active: true,
    },
  });

  const [sellerUser] = await User.findOrCreate({
    where: { email: 'vendedor@comercio.local' },
    defaults: {
      name: 'Vendedor Demo',
      email: 'vendedor@comercio.local',
      password: sellerHash,
      active: true,
    },
  });

  await adminUser.setRoles([adminRole]);
  await sellerUser.setRoles([sellerRole]);

  const clients = [
    { fullName: 'Consumidor final', taxId: '20-30000001-1', phone: '1111-1111', address: 'Centro 100' },
    { fullName: 'Comercial Delta SRL', taxId: '30-70000002-2', phone: '2222-2222', address: 'Industrial 450' },
    { fullName: 'Ferreteria Norte', taxId: '30-70000003-3', phone: '3333-3333', address: 'Ruta 8 Km 25' },
  ];

  for (const item of clients) {
    const [client] = await Client.findOrCreate({ where: { taxId: item.taxId }, defaults: item });
    await client.update(item);
  }

  const suppliers = [
    { businessName: 'Proveedor Uno SA', taxId: '30-80000001-1', phone: '4444-4444', address: 'Parque 200' },
    { businessName: 'Distribuidora Sur', taxId: '30-80000002-2', phone: '5555-5555', address: 'Logistica 890' },
    { businessName: 'Mayorista Centro', taxId: '30-80000003-3', phone: '6666-6666', address: 'Bodega 77' },
  ];

  for (const item of suppliers) {
    await Supplier.findOrCreate({ where: { taxId: item.taxId }, defaults: item });
  }

  const products = [
    { sku: 'PROD-001', name: 'Taladro Inalambrico', costPrice: 120000, salePrice: 168000 },
    { sku: 'PROD-002', name: 'Amoladora Angular', costPrice: 98000, salePrice: 141000 },
    { sku: 'PROD-003', name: 'Juego de Mechas', costPrice: 15000, salePrice: 27000 },
    { sku: 'PROD-004', name: 'Caja de Tornillos x100', costPrice: 7000, salePrice: 13000 },
    { sku: 'PROD-005', name: 'Nivel Laser', costPrice: 86000, salePrice: 125000 },
  ];

  for (const item of products) {
    await Product.findOrCreate({
      where: { sku: item.sku },
      defaults: {
        ...item,
        active: true,
        brandId: brand.id,
        categoryId: category.id,
        unitMeasureId: unit.id,
      },
    });
  }
}

module.exports = { seedCatalogs };

