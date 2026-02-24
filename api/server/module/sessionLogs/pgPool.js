'use strict';

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE || 'expertbridge_logs',
  user: process.env.PG_USER || 'eb_app',
  password: process.env.PG_PASSWORD || 'eb2026logs',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
  console.error('[PG Pool] Unexpected error:', err.message);
});

// Test connection on load
pool.query('SELECT NOW()')
  .then(() => console.log('[PG Pool] Connected to PostgreSQL'))
  .catch(err => console.error('[PG Pool] Connection failed:', err.message));

module.exports = pool;
