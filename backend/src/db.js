const { Pool } = require('pg');
require('dotenv').config();

/**
 * PostgreSQL connection pool.
 * - Uses DATABASE_URL provided by Railway.
 * - SSL is enabled by default for cloud environments.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // eslint-disable-next-line no-console
  console.warn(
    '[WARN] DATABASE_URL is not set. Please configure it before running the server.',
  );
}

const pool = new Pool({
  connectionString,
  ssl: connectionString
    ? { rejectUnauthorized: false } // Railway/Render typical setting
    : false,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};


