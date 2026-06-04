/**
 * Sequelize instance and model registry.
 * Import this to get the shared sequelize instance and (later) models.
 */
const sequelize = require('../config/database');

const User = require('./User');
const QueryHistory = require('./QueryHistory');

User.hasMany(QueryHistory, { foreignKey: 'userId', as: 'queryHistories' });
QueryHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  QueryHistory,
};
