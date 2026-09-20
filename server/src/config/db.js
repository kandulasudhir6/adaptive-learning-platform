import pg from 'pg';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

// Connect to Neon Postgres Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Normalizes query for Postgres
 * Controllers already use $1, $2 syntax which Postgres natively supports!
 * We only need to convert ? to $1, $2 for the seed scripts.
 */
function normalizeQuery(sql) {
  let mappedSql = sql;
  let counter = 1;
  if (mappedSql.includes('?')) {
     mappedSql = mappedSql.replace(/\?/g, () => `$${counter++}`);
  }
  return mappedSql;
}

/**
 * Enhanced pg pool wrapper to catch errors and normalize seed queries
 */
const wrappedPool = {
  query: async (rawSql, params = []) => {
    const sql = normalizeQuery(rawSql);
    try {
      const res = await pool.query(sql, params);
      return { rows: res.rows, rowCount: res.rowCount };
    } catch (err) {
      console.error('Database Query Error:', err.message, '\nSQL:', sql, '\nParams:', params);
      throw err;
    }
  },
  connect: async () => {
    const client = await pool.connect();
    return {
      query: async (rawSql, params = []) => {
        const sql = normalizeQuery(rawSql);
        try {
          const res = await client.query(sql, params);
          return { rows: res.rows, rowCount: res.rowCount };
        } catch (err) {
          console.error('Client Query Error:', err.message, '\nSQL:', sql);
          throw err;
        }
      },
      release: () => client.release()
    };
  }
};

export { crypto };
export default wrappedPool;
