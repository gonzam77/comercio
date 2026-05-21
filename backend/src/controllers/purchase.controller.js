const { Purchase, PurchaseDetail, CurrentAccountEntry, Product, Supplier, Warehouse, User, PaymentMethod, Cashflow } = require('../models');
const { createMovement, withTransaction } = require('../services/inventory.service');
const { requireOpenCashSession, getContextWarehouseId } = require('../services/cash-session.service');

async function listPurchases(_req, res, next) {
  try {
    const rows = await Purchase.findAll({
      include: [{ model: PaymentMethod, attributes: ['id', 'name'] }],
      order: [['purchaseDate', 'DESC'], ['id', 'DESC']],
    });
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

async function getPurchaseById(req, res, next) {
  try {
    const row = await Purchase.findByPk(req.params.id, {
      include: [
        { model: Supplier, attributes: ['id', 'businessName'] },
        { model: User, attributes: ['id', 'name', 'email'] },
        { model: Warehouse, attributes: ['id', 'name'] },
        { model: PaymentMethod, attributes: ['id', 'name'] },
        {
          model: PurchaseDetail,
          include: [{ model: Product, attributes: ['id', 'sku', 'name', 'costPrice'] }],
        },
      ],
    });

    if (!row) {
      return res.status(404).json({ message: 'Compra no encontrada' });
    }

    return res.json(row);
  } catch (error) {
    return next(error);
  }
}

async function createPurchase(req, res, next) {
  try {
    const { supplierId, warehouseId, purchaseDate, invoiceNumber, paymentMethodId, details } = req.body;
    const userId = Number(req.user?.sub);
    const selectedWarehouseId = getContextWarehouseId(req, { requiredForSeller: true });
    const targetWarehouseId = Number(warehouseId);

    if (!details || !Array.isArray(details) || details.length === 0) {
      return res.status(400).json({ message: 'El detalle es obligatorio' });
    }

    if (!paymentMethodId) {
      return res.status(400).json({ message: 'El metodo de pago es obligatorio' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'Usuario autenticado invalido' });
    }
    if (!targetWarehouseId) {
      return res.status(400).json({ message: 'El deposito es obligatorio' });
    }
    if (selectedWarehouseId && selectedWarehouseId !== targetWarehouseId) {
      return res.status(400).json({ message: 'La compra debe registrarse en el punto de venta seleccionado' });
    }

    const total = details.reduce((acc, d) => acc + Number(d.quantity) * Number(d.unitPrice), 0);

    const data = await withTransaction(async (t) => {
      const method = await PaymentMethod.findByPk(paymentMethodId, { transaction: t });
      if (!method) {
        const err = new Error('Metodo de pago no encontrado');
        err.status = 400;
        throw err;
      }

      let cashSession = null;
      if (String(method.name).toUpperCase() === 'EFECTIVO') {
        cashSession = await requireOpenCashSession({ warehouseId: targetWarehouseId, t });
      }

      const movement = await createMovement({
        movementTypeCode: 'COMPRA',
        movementDate: purchaseDate,
        userId,
        warehouseToId: targetWarehouseId,
        details: details.map((d) => ({
          productId: d.productId,
          quantity: d.quantity,
          unitCost: d.unitPrice,
        })),
        t,
      });

      const purchase = await Purchase.create({
        supplierId,
        userId,
        warehouseId: targetWarehouseId,
        purchaseDate,
        invoiceNumber,
        total,
        paymentMethodId: method.id,
        movementId: movement.id,
      }, { transaction: t });

      for (const d of details) {
        await PurchaseDetail.create({
          purchaseId: purchase.id,
          productId: d.productId,
          quantity: d.quantity,
          unitPrice: d.unitPrice,
        }, { transaction: t });
      }

      if (String(method.name).toUpperCase() === 'EFECTIVO') {
        const now = new Date();
        await Cashflow.create({
          movementDate: now.toISOString().slice(0, 10),
          movementAt: now,
          concept: `Egreso por compra ${invoiceNumber || purchase.id}`,
          amount: total,
          type: 'PAYMENT',
          userId,
          cashSessionId: cashSession.id,
          paymentMethodId: method.id,
        }, { transaction: t });
      }

      await CurrentAccountEntry.create({
        supplierId,
        purchaseId: purchase.id,
        movementDate: purchaseDate,
        description: `Compra ${invoiceNumber || purchase.id}`,
        debit: 0,
        credit: total,
      }, { transaction: t });

      return purchase;
    });

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = { listPurchases, getPurchaseById, createPurchase };
