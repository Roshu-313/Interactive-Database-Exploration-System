const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { QueryHistory } = require('../models');
const {
  runNaturalLanguageQuery,
  sendQueryError,
} = require('../services/queryPipeline');

router.post('/nl-to-sql', authMiddleware, async (req, res) => {
  try {
    const { query, rerunSql } = req.body;

    if (query == null || String(query).trim() === '') {
      return sendQueryError(res, 400, {
        category: 'INVALID_INPUT',
        message: 'Query is required',
        naturalLanguageQuery: '',
        generatedSql: null,
      });
    }

    const outcome = await runNaturalLanguageQuery({
      userId: req.user.id,
      query: String(query),
      rerunSql: rerunSql != null ? String(rerunSql) : null,
    });

    if (!outcome.ok) {
      let status = 400;
      if (outcome.category === 'SECURITY_VIOLATION') status = 403;
      else if (outcome.category === 'DATABASE_ERROR') status = 503;
      else if (outcome.category === 'INTERNAL_ERROR') status = 500;

      return sendQueryError(res, status, {
        category: outcome.category,
        message: outcome.message,
        naturalLanguageQuery: outcome.naturalLanguageQuery,
        generatedSql: outcome.generatedSql,
      });
    }

    return res.json({
      status: 'ok',
      message: 'Query executed successfully',
      input: outcome.naturalLanguageQuery,
      sql: outcome.sql,
      results: outcome.results,
      explanation: outcome.explanation,
      resultMeta: outcome.resultMeta,
      queryHistoryId: outcome.queryHistoryId,
    });
  } catch (error) {
    console.error('nl-to-sql unexpected error:', error.message);
    return sendQueryError(res, 500, {
      category: 'INTERNAL_ERROR',
      message: 'Error executing query',
      naturalLanguageQuery: String(req.body?.query || ''),
      generatedSql: null,
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
    });
  }
});

module.exports = router;
