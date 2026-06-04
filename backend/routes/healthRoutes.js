/**
 * Health and DB test routes.
 */
const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

router.get('/', healthController.getHealth);
router.get('/db-status', healthController.getDbStatus);

module.exports = router;
