const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class QueryHistory extends Model {}

QueryHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    naturalLanguageQuery: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    generatedSql: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
  },
  {
    sequelize,
    modelName: 'QueryHistory',
    tableName: 'query_histories',
    timestamps: true,
    updatedAt: false,
    indexes: [{ fields: ['userId'] }, { fields: ['createdAt'] }],
  },
);

module.exports = QueryHistory;
