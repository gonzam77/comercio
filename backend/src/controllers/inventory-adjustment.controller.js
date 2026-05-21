const { Inventory, Product } = require('../models');
const { createMovement, withTransaction } = require('../services/inventory.service');
const { getContextWarehouseId } = require('../services/cash-session.service');

async function createInventoryAdjustment(req, res, next) {
  try {
    const { warehouseId, movementDate, notes, details } = req.body || {};
    const userId = Number(req.user?.sub);
    const selectedWarehouseId = getContextWarehouseId(req, { requiredForSeller: true });
    const targetWarehouseId = Number(warehouseId);

    if (!userId) {
      return res.status(401).json({ message: 'Usuario autenticado invalido' });
    }
    if (!targetWarehouseId) {
      return res.status(400).json({ message: 'El deposito es obligatorio' });
    }
    if (selectedWarehouseId && selectedWarehouseId !== targetWarehouseId) {
      return res.status(400).json({ message: 'El ajuste debe registrarse en el punto de venta seleccionado' });
    }
    if (!movementDate) {
      return res.status(400).json({ message: 'La fecha del ajuste es obligatoria' });
    }
    if (!Array.isArray(details) || details.length === 0) {
      return res.status(400).json({ message: 'Debes incluir al menos un producto en el detalle' });
    }

    const adjustment = await withTransaction(async (t) => {
      const normalized = [];

      for (const d of details) {
        const productId = Number(d.productId);
        const countedStock = Number(d.countedStock);
        if (!productId || !Number.isFinite(countedStock) || countedStock < 0) {
          const err = new Error('Detalle de ajuste invalido');
          err.status = 400;
          throw err;
        }

        const product = await Product.findByPk(productId, { transaction: t });
        if (!product) {
          const err = new Error(`Producto ${productId} no encontrado`);
          err.status = 400;
          throw err;
        }

        const inventory = await Inventory.findOne({
          where: { productId, warehouseId: targetWarehouseId },
          transaction: t,
        });
        const currentStock = Number(inventory?.stock || 0);
        const qtyDelta = countedStock - currentStock;

        if (qtyDelta !== 0) {
          normalized.push({
            productId,
            quantity: Math.abs(qtyDelta),
            qtyDelta,
            unitCost: Number(product.costPrice || 0),
          });
        }
      }

      if (normalized.length === 0) {
        const err = new Error('No hay diferencias para ajustar');
        err.status = 400;
        throw err;
      }

      const movement = await createMovement({
        movementTypeCode: 'AJUSTE',
        movementDate,
        userId,
        warehouseFromId: targetWarehouseId,
        notes: notes || 'Ajuste manual de inventario',
        details: normalized,
        t,
      });

      return movement;
    });

    return res.status(201).json(adjustment);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createInventoryAdjustment,
};
