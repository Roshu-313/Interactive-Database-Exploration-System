const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { QueryRating, QueryHistory } = require('../models');

const router = express.Router();

const MAX_FEEDBACK_LEN = 2000;

function parseRating(value) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1 || n > 5) return null;
  return n;
}

async function assertOwnQueryHistory(userId, queryHistoryId) {
  const row = await QueryHistory.findOne({
    where: { id: queryHistoryId, userId },
    attributes: ['id'],
  });
  return Boolean(row);
}

router.post('/', authMiddleware, async (req, res) => {
  try {
    const queryHistoryId = Number.parseInt(req.body.queryHistoryId, 10);
    const rating = parseRating(req.body.rating);
    const feedback =
      req.body.feedback != null ? String(req.body.feedback).trim().slice(0, MAX_FEEDBACK_LEN) : '';

    if (!Number.isFinite(queryHistoryId) || queryHistoryId <= 0) {
      return res.status(400).json({ status: 'error', message: 'Valid queryHistoryId is required' });
    }
    if (rating == null) {
      return res.status(400).json({ status: 'error', message: 'Rating must be between 1 and 5' });
    }

    const owns = await assertOwnQueryHistory(req.user.id, queryHistoryId);
    if (!owns) {
      return res.status(403).json({ status: 'error', message: 'Cannot rate this query' });
    }

    const existing = await QueryRating.findOne({
      where: { userId: req.user.id, queryHistoryId },
    });

    if (existing) {
      return res.status(409).json({
        status: 'error',
        message: 'You already rated this query. Use PUT to update.',
        ratingId: existing.id,
      });
    }

    const created = await QueryRating.create({
      userId: req.user.id,
      queryHistoryId,
      rating,
      feedback,
    });

    return res.status(201).json({ status: 'ok', rating: created });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to save rating' });
  }
});

router.get('/my', authMiddleware, async (req, res) => {
  try {
    const ratings = await QueryRating.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: QueryHistory,
          as: 'queryHistory',
          attributes: ['id', 'naturalLanguageQuery', 'generatedSql', 'createdAt'],
        },
      ],
    });
    return res.json({ status: 'ok', ratings });
  } catch {
    return res.status(500).json({ status: 'error', message: 'Failed to load ratings' });
  }
});

router.get('/query/:queryHistoryId', authMiddleware, async (req, res) => {
  try {
    const queryHistoryId = Number.parseInt(req.params.queryHistoryId, 10);
    if (!Number.isFinite(queryHistoryId) || queryHistoryId <= 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid query history id' });
    }

    const owns = await assertOwnQueryHistory(req.user.id, queryHistoryId);
    if (!owns) {
      return res.status(403).json({ status: 'error', message: 'Query not found' });
    }

    const rating = await QueryRating.findOne({
      where: { userId: req.user.id, queryHistoryId },
    });

    return res.json({ status: 'ok', rating: rating || null });
  } catch {
    return res.status(500).json({ status: 'error', message: 'Failed to load rating' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const rating = parseRating(req.body.rating);
    const feedback =
      req.body.feedback != null ? String(req.body.feedback).trim().slice(0, MAX_FEEDBACK_LEN) : undefined;

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid rating id' });
    }
    if (rating == null && feedback === undefined) {
      return res.status(400).json({ status: 'error', message: 'Nothing to update' });
    }

    const row = await QueryRating.findOne({ where: { id, userId: req.user.id } });
    if (!row) {
      return res.status(404).json({ status: 'error', message: 'Rating not found' });
    }

    if (rating != null) row.rating = rating;
    if (feedback !== undefined) row.feedback = feedback;
    await row.save();

    return res.json({ status: 'ok', rating: row });
  } catch {
    return res.status(500).json({ status: 'error', message: 'Failed to update rating' });
  }
});

module.exports = router;
