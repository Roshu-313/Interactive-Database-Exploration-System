const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { sequelize } = require('../models');
const schemaService = require('../services/schemaService');

const router = express.Router();

router.get('/tables', authMiddleware, async (req, res) => {
  try {
    const { tables, database } = await schemaService.getTables();
    return res.json({
      status: 'ok',
      tables,
      meta: {
        count: tables.length,
        database,
      },
    });
  } catch (err) {
    console.error('schema/tables failed:', err.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to load database tables',
      error: err.message,
    });
  }
});

router.get('/table/:tableName', authMiddleware, async (req, res) => {
  try {
    const { tableName } = req.params;
    const schema = await schemaService.getTableDetails(tableName);
    return res.json({
      status: 'ok',
      schema,
    });
  } catch (err) {
    if (err.code === 'INVALID_TABLE_NAME') {
      return res.status(400).json({
        status: 'error',
        message:
          'Invalid table name. Use only letters, digits, and underscores (max 64 characters).',
      });
    }
    if (err.code === 'TABLE_NOT_FOUND') {
      return res.status(404).json({
        status: 'error',
        message: 'Table not found',
      });
    }
    console.error('schema/table failed:', err.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to load table schema',
      error: err.message,
    });
  }
});

router.get('/relationships', authMiddleware, async (req, res) => {
  try {
    const relationships = await schemaService.getForeignKeyRelationships();
    return res.json({
      status: 'ok',
      relationships,
      meta: {
        count: relationships.length,
        database: sequelize.config.database,
      },
    });
  } catch (err) {
    console.error('schema/relationships failed:', err.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to load foreign key relationships',
      error: err.message,
    });
  }
});

module.exports = router;
