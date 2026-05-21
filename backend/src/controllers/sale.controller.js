const { Sale, SaleDetail, CurrentAccountEntry, Product, Client, Warehouse, User, PaymentMethod, SalePayment, Cashflow } = require('../models');
const { createMovement, withTransaction } = require('../services/inventory.service');
const { requireOpenCashSession, getContextWarehouseId } = require('../services/cash-session.service');

async function listSales(_req, res, next) {
  try {
    const rows = await Sale.findAll({
      include: [
        {
          model: SalePayment,
          include: [{ model: PaymentMethod, attributes: ['id', 'name'] }],
        },
      ],
      order: [['saleDate', 'DESC'], ['id', 'DESC']],
    });
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

async function getSaleById(req, res, next) {
  try {
    const row = await Sale.findByPk(req.params.id, {
      include: [
        { model: Client, attributes: ['id', 'fullName'] },
        { model: User, attributes: ['id', 'name', 'email'] },
        { model: Warehouse, attributes: ['id', 'name'] },
        {
          model: SaleDetail,
          include: [{ model: Product, attributes: ['id', 'sku', 'name', 'salePrice'] }],
        },
        {
          model: SalePayment,
          include: [{ model: PaymentMethod, attributes: ['id', 'name'] }],
        },
      ],
    });

    if (!row) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    return res.json(row);
  } catch (error) {
    return next(error);
  }
}

async function createSale(req, res, next) {
  try {
    const { clientId, warehouseId, saleDate, invoiceNumber, paymentMethodId, details } = req.body;
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
      return res.status(400).json({ message: 'La venta debe registrarse en el punto de venta seleccionado' });
    }

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

      const normalizedDetails = [];

      for (const d of details) {
        const productId = Number(d.productId);
        const quantity = Number(d.quantity);

        if (!productId || quantity <= 0) {
          const err = new Error('Detalle de venta invalido');
          err.status = 400;
          throw err;
        }

        const product = await Product.findByPk(productId, { transaction: t });
        if (!product) {
          const err = new Error(`Producto ${productId} no encontrado`);
          err.status = 400;
          throw err;
        }

        normalizedDetails.push({
          productId,
          quantity,
          unitPrice: Number(product.salePrice || 0),
        });
      }

      const total = normalizedDetails.reduce((acc, d) => acc + d.quantity * d.unitPrice, 0);

      const movement = await createMovement({
        movementTypeCode: 'VENTA',
        movementDate: saleDate,
        userId,
        warehouseFromId: targetWarehouseId,
        details: normalizedDetails.map((d) => ({
          productId: d.productId,
          quantity: d.quantity,
          unitCost: d.unitPrice,
        })),
        t,
      });

      const sale = await Sale.create({
        clientId,
        userId,
        warehouseId: targetWarehouseId,
        saleDate,
        invoiceNumber,
        total,
        movementId: movement.id,
      }, { transaction: t });

      await SalePayment.create({
        saleId: sale.id,
        paymentMethodId: method.id,
        amount: total,
      }, { transaction: t });

      if (String(method.name).toUpperCase() === 'EFECTIVO') {
        const now = new Date();
        await Cashflow.create({
          movementDate: now.toISOString().slice(0, 10),
          movementAt: now,
          concept: `Ingreso por venta ${invoiceNumber || sale.id}`,
          amount: total,
          type: 'COLLECTION',
          userId,
          cashSessionId: cashSession.id,
          paymentMethodId: method.id,
        }, { transaction: t });
      }

      for (const d of normalizedDetails) {
        await SaleDetail.create({
          saleId: sale.id,
          productId: d.productId,
          quantity: d.quantity,
          unitPrice: d.unitPrice,
        }, { transaction: t });
      }

      await CurrentAccountEntry.create({
        clientId,
        saleId: sale.id,
        movementDate: saleDate,
        description: `Venta ${invoiceNumber || sale.id}`,
        debit: total,
        credit: 0,
      }, { transaction: t });

      return sale;
    });

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = { listSales, getSaleById, createSale };
