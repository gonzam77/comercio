const { CashSession } = require('../models');

async function getMyCashSession(req, res, next) {
  try {
    const userId = Number(req.user?.sub);
    const openSession = await CashSession.findOne({
      where: { userId, status: 'OPEN' },
      order: [['openedAt', 'DESC']],
    });

    if (openSession) {
      return res.json({ hasOpenSession: true, session: openSession });
    }

    const lastSession = await CashSession.findOne({
      where: { userId },
      order: [['openedAt', 'DESC']],
    });

    return res.json({ hasOpenSession: false, session: lastSession });
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

    return res.status(201).json(session);
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

    session.status = 'CLOSED';
    session.closedAt = new Date();
    session.closingAmount = amount;
    await session.save();

    return res.json(session);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getMyCashSession,
  openCashSession,
  closeCashSession,
};
