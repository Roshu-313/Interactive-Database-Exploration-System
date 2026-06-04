/**
 * Express application setup.
 * Central place for middleware and route mounting.
 */
const express = require('express');
const cors = require('cors');

const routes = require('./routes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes (/api includes /api/query via routes/index.js)
app.use('/api', routes);
app.use('/api/admin', adminRoutes);

// Root fallback (optional)
app.get('/', (req, res) => {
  res.json({ message: 'Interactive DB Explorer API', version: '1.0.0' });
});

module.exports = app;
