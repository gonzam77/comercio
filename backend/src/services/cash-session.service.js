const { CashSession } = require('../models');

function getContextWarehouseId(req, { requiredForSeller = true } = {}) {
  const userRoles = req.user?.roles || [];
  const isSeller = userRoles.includes('VENDEDOR');
  const raw = req.headers['x-pos-warehouse-id'];
  const warehouseId = Number(raw);

  if (requiredForSeller && isSeller && (!Number.isInteger(warehouseId) || warehouseId <= 0)) {
    const err = new Error('Debes seleccionar un punto de venta');
    err.status = 400;
    throw err;
  }

  if (Number.isInteger(warehouseId) && warehouseId > 0) return warehouseId;
  return null;
}

async function requireOpenCashSession({ warehouseId, t }) {
  if (!warehouseId) {
    const err = new Error('Debes seleccionar un punto de venta');
    err.status = 400;
    throw err;
  }

  const session = await CashSession.findOne({
    where: { warehouseId, status: 'OPEN' },
    order: [['openedAt', 'DESC']],
    transaction: t,
  });

  if (!session) {
    const err = new Error('Debes abrir caja para operar en efectivo');
    err.status = 400;
    throw err;
  }

  return session;
}

module.exports = { requireOpenCashSession, getContextWarehouseId };
