const express = require('express');
const router = express.Router();
const { QueryTypes } = require('sequelize');

const authMiddleware = require('../middleware/authMiddleware');
const llmToSql = require('../utils/llmToSql');
const llmExplain = require('../utils/llmExplain');
const nlToSql = require('../utils/nlToSql');
const explainSQL = require('../utils/sqlExplain');
const {
  serializeResults,
  buildVisualizationMeta,
} = require('../utils/queryResultVisualization');
const { sequelize, QueryHistory } = require('../models');

router.post('/nl-to-sql', authMiddleware, async (req, res) => {
  try {
    const { query } = req.body;

    if (query == null || String(query).trim() === '') {
      return res.status(400).json({
        message: 'Query is required',
      });
    }

    // 🔹 Step 1: Convert NL → SQL (LLM first)
    let sqlQuery = await llmToSql(query);

    // 🔹 Step 2: Fallback to rule-based if LLM fails
    if (!sqlQuery) {
      sqlQuery = nlToSql(query);
    }

    if (!sqlQuery) {
      return res.status(400).json({
        message: 'Query not understood',
      });
    }

    // 🔹 Step 3: Safety check (ONLY SELECT allowed)
    if (!sqlQuery.toLowerCase().startsWith('select')) {
      return res.status(403).json({
        message: 'Only SELECT queries are allowed',
      });
    }

    // 🔹 Step 4: Execute SQL
    const rawRows = await sequelize.query(sqlQuery, {
      type: QueryTypes.SELECT,
    });

    const results = serializeResults(rawRows);
    const resultMeta = buildVisualizationMeta(results);

    // 🔹 Step 5: Generate explanation (LLM first)
    let explanation = await llmExplain(sqlQuery);

    // 🔹 Step 6: Fallback explanation
    if (!explanation || explanation.includes('not available')) {
      explanation = explainSQL(sqlQuery);
    }

    // 🔹 Persist successful run for query history (non-blocking)
    try {
      await QueryHistory.create({
        userId: req.user.id,
        naturalLanguageQuery: String(query),
        generatedSql: sqlQuery,
        explanation: explanation || '',
      });
    } catch (histErr) {
      console.error('QueryHistory save failed:', histErr.message);
    }

    // 🔹 Step 7: Send response (results + resultMeta; legacy clients ignore resultMeta)
    res.json({
      message: 'Query executed successfully',
      input: query,
      sql: sqlQuery,
      results,
      explanation,
      resultMeta,
    });

  } catch (error) {
    res.status(500).json({
      message: 'Error executing query',
      error: error.message,
    });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const history = await QueryHistory.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      attributes: [
        'id',
        'naturalLanguageQuery',
        'generatedSql',
        'explanation',
        'createdAt',
      ],
    });

    return res.json({
      status: 'ok',
      history,
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to load query history',
      error: err.message,
    });
  }
});

router.delete('/history/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid history id',
      });
    }

    const deleted = await QueryHistory.destroy({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: 'History item not found',
      });
    }

    return res.json({
      status: 'ok',
      message: 'History item deleted',
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete history item',
      error: err.message,
    });
  }
});

module.exports = router;