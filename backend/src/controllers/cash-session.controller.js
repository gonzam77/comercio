const { CashSession, Cashflow, PaymentMethod } = require('../models');
const { User, Role } = require('../models');
const bcrypt = require('bcryptjs');
const { requireOpenCashSession, getContextWarehouseId } = require('../services/cash-session.service');
const { withTransaction } = require('../services/inventory.service');

function calculateSessionSummary(session, movements) {
  const openingAmount = Number(session?.openingAmount || 0);
  const totalCollections = movements
    .filter((m) => m.type === 'COLLECTION')
    .reduce((acc, m) => acc + Number(m.amount || 0), 0);
  const totalPayments = movements
    .filter((m) => m.type === 'PAYMENT')
    .reduce((acc, m) => acc + Number(m.amount || 0), 0);
  const expectedBalance = openingAmount + totalCollections - totalPayments;
  const countedBalance = session?.status === 'CLOSED' ? Number(session.closingAmount || 0) : null;
  const persistedExpected = session?.status === 'CLOSED' ? Number(session.expectedClosingAmount ?? expectedBalance) : expectedBalance;
  const persistedDifference = session?.status === 'CLOSED'
    ? Number(session.closingDifferenceAmount ?? ((countedBalance ?? 0) - persistedExpected))
    : null;
  return {
    openingAmount,
    totalCollections,
    totalPayments,
    expectedBalance: persistedExpected,
    countedBalance,
    difference: persistedDifference,
  };
}

async function getSessionMovements(sessionId) {
  return Cashflow.findAll({
    where: { cashSessionId: sessionId },
    include: [{ model: PaymentMethod, attributes: ['id', 'name'] }],
    order: [['movementAt', 'DESC'], ['id', 'DESC']],
  });
}

async function getMyCashSession(req, res, next) {
  try {
    const userId = Number(req.user?.sub);
    const warehouseId = getContextWarehouseId(req, { requiredForSeller: true });
    if (!warehouseId) {
      return res.status(400).json({ message: 'Debes seleccionar un punto de venta' });
    }
    const openSession = await CashSession.findOne({
      where: { warehouseId, status: 'OPEN' },
      order: [['openedAt', 'DESC']],
    });

    const targetSession = openSession || await CashSession.findOne({
      where: { warehouseId },
      order: [['openedAt', 'DESC']],
    });

    if (!targetSession) {
      return res.json({ hasOpenSession: false, session: null, summary: null, movements: [], recentSessions: [] });
    }

    const movements = await getSessionMovements(targetSession.id);
    const summary = calculateSessionSummary(targetSession, movements);
    const recentSessions = await CashSession.findAll({
      where: { warehouseId },
      order: [['openedAt', 'DESC']],
      limit: 30,
    });
    return res.json({
      hasOpenSession: targetSession.status === 'OPEN',
      session: targetSession,
      summary,
      movements,
      recentSessions,
    });
  } catch (error) {
    return next(error);
  }
}

async function openCashSession(req, res, next) {
  try {
    const userId = Number(req.user?.sub);
    const warehouseId = getContextWarehouseId(req, { requiredForSeller: true });
    if (!warehouseId) {
      return res.status(400).json({ message: 'Debes seleccionar un punto de venta' });
    }
    const { openingAmount } = req.body;

    const existing = await CashSession.findOne({ where: { warehouseId, status: 'OPEN' } });
    if (existing) {
      return res.status(400).json({ message: 'Ya existe una caja abierta para este punto de venta' });
    }

    const amount = Number(openingAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ message: 'El monto de apertura es invalido' });
    }

    const session = await CashSession.create({
      userId,
      warehouseId,
      openingAmount: amount,
      openedAt: new Date(),
      status: 'OPEN',
    });

    return res.status(201).json({
      session,
      summary: {
        openingAmount: Number(session.openingAmount || 0),
        totalCollections: 0,
        totalPayments: 0,
        expectedBalance: Number(session.openingAmount || 0),
        countedBalance: null,
        difference: null,
      },
      movements: [],
    });
  } catch (error) {
    return next(error);
  }
}

async function closeCashSession(req, res, next) {
  try {
    const warehouseId = getContextWarehouseId(req, { requiredForSeller: true });
    if (!warehouseId) {
      return res.status(400).json({ message: 'Debes seleccionar un punto de venta' });
    }
    const { closingAmount } = req.body;

    const session = await CashSession.findOne({
      where: { warehouseId, status: 'OPEN' },
      order: [['openedAt', 'DESC']],
    });

    if (!session) {
      const lastSession = await CashSession.findOne({
        where: { warehouseId },
        order: [['openedAt', 'DESC']],
      });
      if (lastSession && lastSession.status === 'CLOSED') {
        return res.status(409).json({ message: 'La caja ya fue cerrada por otro usuario' });
      }
      return res.status(400).json({ message: 'No hay una caja abierta para cerrar' });
    }

    const amount = Number(closingAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ message: 'El monto de cierre es invalido' });
    }

    const movements = await getSessionMovements(session.id);
    const preCloseSummary = calculateSessionSummary(session, movements);
    const closedAt = new Date();

    session.status = 'CLOSED';
    session.closedAt = closedAt;
    session.closingAmount = amount;
    session.expectedClosingAmount = preCloseSummary.expectedBalance;
    session.closingDifferenceAmount = amount - preCloseSummary.expectedBalance;
    await session.save();

    const summary = {
      ...preCloseSummary,
      countedBalance: amount,
      difference: amount - preCloseSummary.expectedBalance,
    };

    return res.json({ session, summary, movements });
  } catch (error) {
    return next(error);
  }
}

async function withdrawFromCashSession(req, res, next) {
  try {
    const warehouseId = getContextWarehouseId(req, { requiredForSeller: true });
    if (!warehouseId) {
      return res.status(400).json({ message: 'Debes seleccionar un punto de venta' });
    }
    const { amount, adminPassword } = req.body || {};

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'El monto del retiro es invalido' });
    }
    if (!adminPassword || !String(adminPassword).trim()) {
      return res.status(400).json({ message: 'La contrasena de administrador es obligatoria' });
    }

    const admins = await User.findAll({
      where: { active: true },
      include: [{
        model: Role,
        where: { name: 'ADMIN' },
        through: { attributes: [] },
      }],
    });

    let authorizingAdmin = null;
    for (const admin of admins) {
      const ok = await bcrypt.compare(String(adminPassword), String(admin.password || ''));
      if (ok) {
        authorizingAdmin = admin;
        break;
      }
    }

    if (!authorizingAdmin) {
      return res.status(401).json({ message: 'Contrasena de administrador invalida' });
    }

    const result = await withTransaction(async (t) => {
      const session = await requireOpenCashSession({ warehouseId, t });
      const now = new Date();
      const cashflow = await Cashflow.create({
        movementDate: now.toISOString().slice(0, 10),
        movementAt: now,
        concept: `Retiro de caja autorizado por ${authorizingAdmin.name}`,
        amount: numericAmount,
        type: 'PAYMENT',
        userId: authorizingAdmin.id,
        cashSessionId: session.id,
      }, { transaction: t });

      return { cashflow, sessionId: session.id };
    });

    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getMyCashSession,
  openCashSession,
  closeCashSession,
  withdrawFromCashSession,
};
