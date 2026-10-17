/**
 * Sequelize instance and model registry.
 * Import this to get the shared sequelize instance and (later) models.
 */
const sequelize = require('../config/database');

const User = require('./User');
const QueryHistory = require('./QueryHistory');
const QueryRating = require('./QueryRating');

User.hasMany(QueryHistory, { foreignKey: 'userId', as: 'queryHistories' });
QueryHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(QueryRating, { foreignKey: 'userId', as: 'queryRatings' });
QueryRating.belongsTo(User, { foreignKey: 'userId', as: 'user' });

QueryHistory.hasMany(QueryRating, { foreignKey: 'queryHistoryId', as: 'ratings' });
QueryRating.belongsTo(QueryHistory, { foreignKey: 'queryHistoryId', as: 'queryHistory' });

module.exports = {
  sequelize,
  User,
  QueryHistory,
  QueryRating,
};
