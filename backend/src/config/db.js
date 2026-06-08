const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
  min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_MS, 10) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECT_MS, 10) || 10000,
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT_MS, 10) || 30000,
});

pool.on('error', (err) => {
  const logger = require('../utils/logger');
  logger.error({ err, msg: 'Unexpected PostgreSQL pool error' });
});

const SLOW_MS = parseInt(process.env.DB_SLOW_QUERY_MS, 10) || 500;

const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration >= SLOW_MS) {
      const logger = require('../utils/logger');
      logger.warn({
        msg: 'Slow query',
        durationMs: duration,
        query: text.slice(0, 200),
      });
    }
    return result;
  } catch (err) {
    const logger = require('../utils/logger');
    logger.error({
      msg: 'Query failed',
      durationMs: Date.now() - start,
      query: text.slice(0, 200),
      err: err.message,
    });
    throw err;
  }
};

module.exports = { query, pool };
