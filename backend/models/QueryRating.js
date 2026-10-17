const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class QueryRating extends Model {}

QueryRating.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    queryHistoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'query_histories', key: 'id' },
      onDelete: 'CASCADE',
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
  },
  {
    sequelize,
    modelName: 'QueryRating',
    tableName: 'query_ratings',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['queryHistoryId'] },
      { unique: true, fields: ['userId', 'queryHistoryId'] },
      { fields: ['createdAt'] },
    ],
  },
);

module.exports = QueryRating;
