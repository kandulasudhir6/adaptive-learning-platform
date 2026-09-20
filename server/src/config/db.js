import pg from 'pg';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Used by authController.js and others
export { crypto };

// pg.Pool.query matches the signature of the previous SQLite wrapper.
export default pool;
