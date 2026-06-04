/**
 * Route aggregator.
 * Mount all API route modules here.
 */
const express = require('express');
const router = express.Router();
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const queryRoutes = require('./queryRoutes');
const schemaRoutes = require('./schemaRoutes');

// Mount health routes at /api/health -> GET /api/health, GET /api/health/db-status
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/query', queryRoutes);
router.use('/schema', schemaRoutes);

module.exports = router;
