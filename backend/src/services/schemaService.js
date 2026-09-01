/**
 * services/schemaService.js
 *
 * Introspects the live Postgres schema from information_schema and caches it
 * in memory. The cache is refreshed every CACHE_TTL_MS milliseconds or
 * on-demand via refreshSchema().
 *
 * Returns a structured object used by the prompt builder, and a formatted
 * string representation used directly in the LLM system prompt.
 */

const { query } = require("../db");

// Tables that are part of the application schema (allow-list)
const ALLOWED_TABLES = ["customers", "products", "orders", "order_items"];

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let _cache = null;
let _cacheTimestamp = 0;

/**
 * Fetch schema from information_schema for allowed tables only.
 * @returns {Promise<Object>} Raw schema object keyed by table name
 */
async function fetchSchemaFromDB() {
  const result = await query(
    `
    SELECT
      c.table_name,
      c.column_name,
      c.data_type,
      c.is_nullable,
      c.column_default,
      tc.constraint_type
    FROM information_schema.columns c
    LEFT JOIN information_schema.key_column_usage kcu
      ON c.table_name = kcu.table_name
      AND c.column_name = kcu.column_name
      AND c.table_schema = kcu.table_schema
    LEFT JOIN information_schema.table_constraints tc
      ON kcu.constraint_name = tc.constraint_name
      AND kcu.table_schema = tc.table_schema
      AND tc.constraint_type = 'PRIMARY KEY'
    WHERE c.table_schema = 'public'
      AND c.table_name = ANY($1)
    ORDER BY c.table_name, c.ordinal_position
    `,
    [ALLOWED_TABLES]
  );

  // Group columns by table
  const schema = {};
  for (const row of result.rows) {
    if (!schema[row.table_name]) {
      schema[row.table_name] = { columns: [] };
    }
    schema[row.table_name].columns.push({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === "YES",
      isPrimaryKey: row.constraint_type === "PRIMARY KEY",
    });
  }
  return schema;
}

/**
 * Format the schema object into a concise DDL-like string for the LLM prompt.
 * Example output:
 *   customers(customer_id INT PK, name TEXT, email TEXT, region TEXT, signup_date DATE)
 */
function formatSchemaForPrompt(schema) {
  return Object.entries(schema)
    .map(([table, { columns }]) => {
      const cols = columns
        .map((c) => {
          let def = `${c.name} ${c.type.toUpperCase()}`;
          if (c.isPrimaryKey) def += " PK";
          if (!c.nullable && !c.isPrimaryKey) def += " NOT NULL";
          return def;
        })
        .join(", ");
      return `${table}(${cols})`;
    })
    .join("\n");
}

/**
 * Get the cached schema, refreshing from DB if stale.
 * @returns {Promise<{ raw: Object, formatted: string, allowedTables: string[], allowedColumns: Object }>}
 */
async function getSchema() {
  const now = Date.now();
  if (_cache && now - _cacheTimestamp < CACHE_TTL_MS) {
    return _cache;
  }
  return refreshSchema();
}

/**
 * Force-refresh the schema cache from the live DB.
 */
async function refreshSchema() {
  console.log("[schema] Refreshing schema from DB...");
  const raw = await fetchSchemaFromDB();
  const formatted = formatSchemaForPrompt(raw);

  // Build an allow-list map: { tableName: Set<columnName> }
  const allowedColumns = {};
  for (const [table, { columns }] of Object.entries(raw)) {
    allowedColumns[table] = new Set(columns.map((c) => c.name));
  }

  // Default fallback schema if tables haven't been created in Supabase yet
  const fallbackFormatted = `
customers(customer_id INT PK, name TEXT, email TEXT, region TEXT, signup_date DATE)
products(product_id INT PK, name TEXT, category TEXT, price NUMERIC)
orders(order_id INT PK, customer_id INT, order_date DATE, status TEXT)
order_items(order_item_id INT PK, order_id INT, product_id INT, quantity INT, unit_price NUMERIC)
`.trim();

  const tables = Object.keys(raw).length > 0 ? Object.keys(raw) : ALLOWED_TABLES;

  _cache = {
    raw,
    formatted: formatted || fallbackFormatted,
    tables,
    columns: new Map(Object.entries(allowedColumns)),
    allowedTables: tables,
    allowedColumns,
  };
  _cacheTimestamp = Date.now();
  console.log(`[schema] Cached ${_cache.tables.length} tables.`);
  return _cache;
}

module.exports = { getSchema, refreshSchema, ALLOWED_TABLES };
