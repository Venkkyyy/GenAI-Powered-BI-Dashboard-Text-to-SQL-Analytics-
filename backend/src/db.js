/**
 * db.js — Postgres connection pool using the Supabase connection pooler URL.
 * Uses the `pg` library's Pool for connection reuse.
 * The pool is lazy — it connects on first query, not on module import.
 */

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase connection pooler (Transaction mode) works best with ssl: require
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  // Conservative pool size — Supabase free tier has connection limits
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on("error", (err) => {
  console.error("[db] Unexpected pool error:", err.message);
});

/**
 * Execute a parameterized query.
 * @param {string} text  SQL string (use $1, $2 placeholders)
 * @param {any[]}  params
 * @returns {Promise<import("pg").QueryResult>}
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.LOG_LEVEL === "debug") {
      console.log(`[db] query (${duration}ms) rows=${result.rowCount}`);
    }
    return result;
  } catch (err) {
    console.error("[db] query error:", err.message, "\nSQL:", text);
    throw err;
  }
}

/**
 * Test that the DB is reachable. Used by /api/health.
 * @returns {Promise<boolean>}
 */
async function ping() {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

module.exports = { query, ping, pool };
