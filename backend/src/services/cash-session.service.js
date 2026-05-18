const { CashSession } = require('../models');

async function requireOpenCashSession({ userId, t }) {
  const session = await CashSession.findOne({
    where: { userId, status: 'OPEN' },
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

module.exports = { requireOpenCashSession };
