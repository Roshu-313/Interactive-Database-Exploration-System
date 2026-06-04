/**
 * Sequelize + MySQL configuration.
 * Reads from environment variables for security and flexibility.
 */
const { Sequelize } = require('sequelize');

const {
  DB_HOST = 'localhost',
  DB_PORT = 3306,
  DB_NAME = 'interactive_db_explorer',
  DB_USER = 'root',
  DB_PASSWORD = '',
} = process.env;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

module.exports = sequelize;
