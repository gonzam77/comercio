require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/database');
const { DataTypes } = require('sequelize');
require('./models');
const { seedCatalogs } = require('./utils/seed');

const PORT = Number(process.env.PORT || 3000);

async function ensureCashflowColumns() {
  const qi = sequelize.getQueryInterface();
  const table = await qi.describeTable('cashflows');
  if (!table.movementAt) {
    await qi.addColumn('cashflows', 'movementAt', {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    });
  }
  if (!table.userId) {
    await qi.addColumn('cashflows', 'userId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
  }
  if (!table.cashSessionId) {
    await qi.addColumn('cashflows', 'cashSessionId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
  }
}

async function ensureCashSessionColumns() {
  const qi = sequelize.getQueryInterface();
  const table = await qi.describeTable('cash_sessions');
  if (!table.expectedClosingAmount) {
    await qi.addColumn('cash_sessions', 'expectedClosingAmount', {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
    });
  }
  if (!table.closingDifferenceAmount) {
    await qi.addColumn('cash_sessions', 'closingDifferenceAmount', {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
    });
  }
}

async function ensureWarehouseColumns() {
  const qi = sequelize.getQueryInterface();
  const table = await qi.describeTable('warehouses');
  if (!table.active) {
    await qi.addColumn('warehouses', 'active', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  }
}

async function bootstrap() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({force:false});
    await ensureCashflowColumns();
    await ensureCashSessionColumns();
    await ensureWarehouseColumns();
    await seedCatalogs();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

bootstrap();
