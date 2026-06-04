/**
 * Config barrel file.
 * Re-export configuration modules for clean imports.
 */
const database = require('./database');

module.exports = {
  database,
};
