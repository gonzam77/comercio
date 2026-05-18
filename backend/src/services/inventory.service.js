const {
  sequelize,
  MovementType,
  Movement,
  MovementDetail,
  Inventory,
  Kardex,
  Product,
} = require('../models');

async function adjustStock({ productId, warehouseId, qtyDelta, t }) {
  const [inventory] = await Inventory.findOrCreate({
    where: { productId, warehouseId },
    defaults: { stock: 0 },
    transaction: t,
  });

  const newStock = Number(inventory.stock) + Number(qtyDelta);
  if (newStock < 0) {
    const product = await Product.findByPk(productId, { transaction: t });
    const productLabel = product?.name || `ID ${productId}`;
    const disponible = Number(inventory.stock);
    const solicitado = Math.abs(Number(qtyDelta));
    const err = new Error(
      `Stock insuficiente para ${productLabel} en el deposito ${warehouseId}. Disponible: ${disponible}. Solicitado: ${solicitado}.`
    );
    err.status = 400;
    throw err;
  }

  inventory.stock = newStock;
  await inventory.save({ transaction: t });
  return newStock;
}

async function createMovement({
  movementTypeCode,
  movementDate,
  userId,
  warehouseFromId,
  warehouseToId,
  notes,
  details,
  t,
}) {
  const movementType = await MovementType.findOne({ where: { code: movementTypeCode }, transaction: t });
  if (!movementType) {
    const err = new Error(`Tipo de movimiento ${movementTypeCode} no encontrado`);
    err.status = 400;
    throw err;
  }

  const movement = await Movement.create({
    movementTypeId: movementType.id,
    movementDate,
    userId,
    warehouseFromId,
    warehouseToId,
    notes,
  }, { transaction: t });

  for (const d of details) {
    await MovementDetail.create({
      movementId: movement.id,
      productId: d.productId,
      quantity: d.quantity,
      unitCost: d.unitCost || 0,
    }, { transaction: t });

    const qty = Number(d.quantity);

    if (movementTypeCode === 'COMPRA') {
      const balanceQty = await adjustStock({
        productId: d.productId,
        warehouseId: warehouseToId,
        qtyDelta: qty,
        t,
      });
      await Kardex.create({
        movementId: movement.id,
        productId: d.productId,
        warehouseId: warehouseToId,
        movementDate,
        quantityIn: qty,
        quantityOut: 0,
        balanceQty,
        unitCost: d.unitCost || 0,
      }, { transaction: t });
    }

    if (movementTypeCode === 'VENTA') {
      const balanceQty = await adjustStock({
        productId: d.productId,
        warehouseId: warehouseFromId,
        qtyDelta: -qty,
        t,
      });
      await Kardex.create({
        movementId: movement.id,
        productId: d.productId,
        warehouseId: warehouseFromId,
        movementDate,
        quantityIn: 0,
        quantityOut: qty,
        balanceQty,
        unitCost: d.unitCost || 0,
      }, { transaction: t });
    }

    if (movementTypeCode === 'TRANSFERENCIA') {
      const fromBalance = await adjustStock({
        productId: d.productId,
        warehouseId: warehouseFromId,
        qtyDelta: -qty,
        t,
      });
      const toBalance = await adjustStock({
        productId: d.productId,
        warehouseId: warehouseToId,
        qtyDelta: qty,
        t,
      });

      await Kardex.create({
        movementId: movement.id,
        productId: d.productId,
        warehouseId: warehouseFromId,
        movementDate,
        quantityIn: 0,
        quantityOut: qty,
        balanceQty: fromBalance,
        unitCost: d.unitCost || 0,
      }, { transaction: t });

      await Kardex.create({
        movementId: movement.id,
        productId: d.productId,
        warehouseId: warehouseToId,
        movementDate,
        quantityIn: qty,
        quantityOut: 0,
        balanceQty: toBalance,
        unitCost: d.unitCost || 0,
      }, { transaction: t });
    }
  }

  return movement;
}

async function withTransaction(task) {
  return sequelize.transaction(async (t) => task(t));
}

module.exports = {
  createMovement,
  withTransaction,
};
