/**
 * Application entry point.
 * Loads environment variables and starts the Express server.
 */
require('dotenv').config();

const app = require('./app');
const { sequelize } = require('./models');
const { PORT = 3000 } = process.env;

async function start() {
  try {
    await sequelize.authenticate();
    const syncOptions =
      process.env.NODE_ENV === 'production' ? {} : { alter: true };
    await sequelize.sync(syncOptions);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    const code = err?.parent?.code || err?.original?.code;
    const refused =
      code === 'ECONNREFUSED' ||
      err?.name === 'SequelizeConnectionRefusedError';

    console.error('Failed to start server:', err.message || err);

    if (refused) {
      const host = process.env.DB_HOST || 'localhost';
      const port = process.env.DB_PORT || '3306';
      console.error('\n--- MySQL connection refused ---');
      console.error(
        `Nothing is accepting connections at ${host}:${port}. Common fixes:`,
      );
      console.error('  1. Start MySQL (XAMPP/WAMP/Laragon panel, or Windows Services).');
      console.error('  2. Match backend/.env: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME.');
      console.error('  3. Create the database (e.g. CREATE DATABASE your_db_name;) if it does not exist.\n');
    }

    process.exitCode = 1;
  }
}

start();
