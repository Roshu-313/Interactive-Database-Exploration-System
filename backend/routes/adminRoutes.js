const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { QueryHistory, User } = require('../models');

// Admin-only route
router.get('/dashboard', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  res.json({
    message: 'Welcome Admin Dashboard',
    user: req.user,
  });
});

router.get('/query-history', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const rawLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), 500)
      : 200;

    const history = await QueryHistory.findAll({
      limit,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role'],
        },
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

module.exports = router;

