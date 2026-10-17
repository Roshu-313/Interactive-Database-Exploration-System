const express = require('express');
const { Op, fn, col } = require('sequelize');

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { QueryHistory, User, QueryRating } = require('../models');
const { parsePagination, sanitizeSearchTerm } = require('../utils/pagination');

const router = express.Router();
const adminOnly = [authMiddleware, roleMiddleware(['admin'])];

const USER_PUBLIC_ATTRS = ['id', 'name', 'email', 'role', 'createdAt'];

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

router.get('/dashboard', ...adminOnly, async (req, res) => {
  try {
    const todayStart = startOfToday();
    const weekStart = daysAgo(7);

    const [
      totalUsers,
      totalQueries,
      queriesToday,
      queriesLast7Days,
      totalRatings,
      avgRatingRow,
      recentQueries,
    ] = await Promise.all([
      User.count(),
      QueryHistory.count(),
      QueryHistory.count({ where: { createdAt: { [Op.gte]: todayStart } } }),
      QueryHistory.count({ where: { createdAt: { [Op.gte]: weekStart } } }),
      QueryRating.count(),
      QueryRating.findOne({
        attributes: [[fn('AVG', col('rating')), 'avgRating']],
        raw: true,
      }),
      QueryHistory.findAll({
        limit: 8,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'naturalLanguageQuery', 'generatedSql', 'createdAt'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email'],
          },
        ],
      }),
    ]);

    const avgRating = avgRatingRow?.avgRating
      ? Number.parseFloat(Number(avgRatingRow.avgRating).toFixed(2))
      : null;

    return res.json({
      status: 'ok',
      stats: {
        totalUsers,
        totalQueries,
        queriesToday,
        queriesLast7Days,
        totalRatings,
        avgRating,
      },
      recentQueries,
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to load dashboard',
    });
  }
});

router.get('/users', ...adminOnly, async (req, res) => {
  try {
    const { limit, offset } = parsePagination(req.query, { limit: 15, maxLimit: 50 });
    const search = sanitizeSearchTerm(req.query.search);

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: USER_PUBLIC_ATTRS,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return res.json({
      status: 'ok',
      users: rows,
      pagination: { total: count, limit, offset },
    });
  } catch {
    return res.status(500).json({ status: 'error', message: 'Failed to load users' });
  }
});

router.get('/users/:id/activity', ...adminOnly, async (req, res) => {
  try {
    const userId = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid user id' });
    }

    const user = await User.findByPk(userId, { attributes: USER_PUBLIC_ATTRS });
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const { limit, offset } = parsePagination(req.query, { limit: 10, maxLimit: 50 });
    const { rows, count } = await QueryHistory.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      attributes: ['id', 'naturalLanguageQuery', 'generatedSql', 'createdAt'],
    });

    return res.json({
      status: 'ok',
      user,
      queries: rows,
      pagination: { total: count, limit, offset },
    });
  } catch {
    return res.status(500).json({ status: 'error', message: 'Failed to load user activity' });
  }
});

router.patch('/users/:id/role', ...adminOnly, async (req, res) => {
  try {
    const userId = Number.parseInt(req.params.id, 10);
    const role = req.body?.role;

    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid user id' });
    }
    if (role !== 'user' && role !== 'admin') {
      return res.status(400).json({ status: 'error', message: 'Role must be user or admin' });
    }

    const target = await User.findByPk(userId, { attributes: ['id', 'role', 'name', 'email'] });
    if (!target) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    if (target.role === 'admin' && role === 'user') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot remove the last administrator',
        });
      }
    }

    target.role = role;
    await target.save();

    return res.json({
      status: 'ok',
      user: {
        id: target.id,
        name: target.name,
        email: target.email,
        role: target.role,
      },
    });
  } catch {
    return res.status(500).json({ status: 'error', message: 'Failed to update role' });
  }
});

router.get('/query-history', ...adminOnly, async (req, res) => {
  try {
    const { limit, offset } = parsePagination(req.query, { limit: 20, maxLimit: 100 });
    const search = sanitizeSearchTerm(req.query.search);

    const where = {};
    if (search) {
      where[Op.or] = [
        { naturalLanguageQuery: { [Op.like]: `%${search}%` } },
        { generatedSql: { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows, count } = await QueryHistory.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: [
        'id',
        'naturalLanguageQuery',
        'generatedSql',
        'explanation',
        'createdAt',
        'userId',
      ],
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
      history: rows,
      pagination: { total: count, limit, offset },
    });
  } catch {
    return res.status(500).json({ status: 'error', message: 'Failed to load query history' });
  }
});

router.get('/ratings/stats', ...adminOnly, async (req, res) => {
  try {
    const totalRatings = await QueryRating.count();
    const avgRow = await QueryRating.findOne({
      attributes: [[fn('AVG', col('rating')), 'avgRating']],
      raw: true,
    });
    const avgRating = avgRow?.avgRating
      ? Number.parseFloat(Number(avgRow.avgRating).toFixed(2))
      : null;

    const distributionRows = await QueryRating.findAll({
      attributes: ['rating', [fn('COUNT', col('id')), 'count']],
      group: ['rating'],
      raw: true,
    });

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of distributionRows) {
      const r = Number.parseInt(row.rating, 10);
      if (r >= 1 && r <= 5) {
        distribution[r] = Number.parseInt(row.count, 10) || 0;
      }
    }

    return res.json({
      status: 'ok',
      stats: { totalRatings, avgRating, distribution },
    });
  } catch {
    return res.status(500).json({ status: 'error', message: 'Failed to load rating stats' });
  }
});

router.get('/ratings', ...adminOnly, async (req, res) => {
  try {
    const { limit, offset } = parsePagination(req.query, { limit: 15, maxLimit: 50 });

    const { rows, count } = await QueryRating.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: QueryHistory,
          as: 'queryHistory',
          attributes: ['id', 'naturalLanguageQuery', 'generatedSql', 'createdAt'],
        },
      ],
    });

    return res.json({
      status: 'ok',
      ratings: rows,
      pagination: { total: count, limit, offset },
    });
  } catch {
    return res.status(500).json({ status: 'error', message: 'Failed to load ratings' });
  }
});

module.exports = router;
