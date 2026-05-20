const { CashSession, Cashflow, PaymentMethod } = require('../models');

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
    const openSession = await CashSession.findOne({
      where: { userId, status: 'OPEN' },
      order: [['openedAt', 'DESC']],
    });

    const targetSession = openSession || await CashSession.findOne({
      where: { userId },
      order: [['openedAt', 'DESC']],
    });

    if (!targetSession) {
      return res.json({ hasOpenSession: false, session: null, summary: null, movements: [], recentSessions: [] });
    }

    const movements = await getSessionMovements(targetSession.id);
    const summary = calculateSessionSummary(targetSession, movements);
    const recentSessions = await CashSession.findAll({
      where: { userId },
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
    const { openingAmount } = req.body;

    const existing = await CashSession.findOne({ where: { userId, status: 'OPEN' } });
    if (existing) {
      return res.status(400).json({ message: 'Ya existe una caja abierta para este usuario' });
    }

    const amount = Number(openingAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ message: 'El monto de apertura es invalido' });
    }

    const session = await CashSession.create({
      userId,
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
    const userId = Number(req.user?.sub);
    const { closingAmount } = req.body;

    const session = await CashSession.findOne({
      where: { userId, status: 'OPEN' },
      order: [['openedAt', 'DESC']],
    });

    if (!session) {
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

module.exports = {
  getMyCashSession,
  openCashSession,
  closeCashSession,
};
