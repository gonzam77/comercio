require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/database');
require('./models');
const { seedCatalogs } = require('./utils/seed');

const PORT = Number(process.env.PORT || 3000);

async function bootstrap() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
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
