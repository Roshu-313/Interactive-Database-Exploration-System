/**
 * Health / test controller.
 * Used for basic server and DB connectivity checks.
 */
const { sequelize } = require('../models');

async function getHealth(req, res) {
  try {
    res.json({
      status: 'ok',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

async function getDbStatus(req, res) {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'ok',
      message: 'Database connection successful',
      database: sequelize.config.database,
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
      error: err.message,
    });
  }
}

module.exports = {
  getHealth,
  getDbStatus,
};
