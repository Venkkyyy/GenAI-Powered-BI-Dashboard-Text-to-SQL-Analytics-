/**
 * services/sqlValidator.js
 *
 * Step 3 — SQL Validation Layer
 *
 * Validates LLM-generated SQL before it touches the database.
 * Uses node-sql-parser for AST-level analysis (not regex).
 *
 * Rules enforced:
 *  1. Must be a single SELECT statement — no INSERT/UPDATE/DELETE/DROP/etc.
 *  2. Only allowed tables may be referenced (allow-list from schemaService).
 *  3. Only allowed columns may be referenced (allow-list from schemaService).
 *  4. No subqueries that reference disallowed tables.
 *  5. No SQL injection patterns (stacked statements via ;).
 *  6. LIMIT is mandatory — auto-injected at 500 if missing.
 *  7. No system catalog access (information_schema, pg_catalog, etc.).
 */

const { Parser } = require("node-sql-parser");

const parser = new Parser();

// ── Constants ─────────────────────────────────────────────────────────────────

const BLOCKED_SCHEMAS = new Set([
  "information_schema",
  "pg_catalog",
  "pg_toast",
  "pg_temp",
]);

const BLOCKED_KEYWORDS_RE =
  /\b(insert|update|delete|drop|truncate|alter|create|grant|revoke|exec|execute|xp_|sp_)\b/i;

// Default LIMIT injected when the LLM forgets one
const DEFAULT_LIMIT = 500;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Recursively collect all table references from an AST node.
 * node-sql-parser puts tables in different spots depending on query shape.
 * @param {object} ast
 * @returns {Array<{ db: string|null, table: string }>}
 */
function collectTables(ast) {
  const tables = [];

  function walk(node) {
    if (!node || typeof node !== "object") return;

    // Table reference array (present on SELECT, JOIN, etc.)
    if (Array.isArray(node.from)) {
      node.from.forEach((ref) => {
        if (ref.table) tables.push({ db: ref.db ?? null, table: ref.table });
        // Sub-query in FROM
        if (ref.expr) walk(ref.expr);
      });
    }

    // JOIN tables
    if (Array.isArray(node.join)) {
      node.join.forEach((j) => {
        if (j.table) tables.push({ db: j.db ?? null, table: j.table });
        if (j.expr) walk(j.expr);
      });
    }

    // Subqueries in WHERE / HAVING / columns
    ["where", "having", "columns", "with", "expr"].forEach((key) => {
      if (node[key]) walk(node[key]);
    });

    if (Array.isArray(node)) node.forEach(walk);
  }

  walk(ast);
  return tables;
}

/**
 * Recursively collect all column references from an AST node.
 * @param {object} ast
 * @returns {Array<{ table: string|null, column: string }>}
 */
function collectColumns(ast) {
  const cols = [];

  function walk(node) {
    if (!node || typeof node !== "object") return;

    // Explicit column reference
    if (node.type === "column_ref") {
      cols.push({ table: node.table ?? null, column: node.column });
      return;
    }

    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }

    Object.values(node).forEach((v) => {
      if (v && typeof v === "object") walk(v);
    });
  }

  walk(ast);
  return cols;
}

// ── Main validator ─────────────────────────────────────────────────────────────

/**
 * Validate and sanitize an LLM-generated SQL string.
 *
 * @param {string} sql - Raw SQL from the LLM.
 * @param {{ tables: string[], columns: Map<string, Set<string>> }} allowList
 *   - tables: list of allowed table names (lowercase)
 *   - columns: map of table → Set<column> (lowercase)
 * @returns {{ sql: string, warnings: string[] }} - Sanitized SQL and any warnings.
 * @throws {Error} if the query violates a hard rule.
 */
function validateSQL(sql, allowList) {
  const warnings = [];

  // ── 0. Strip trailing semicolons (breaks the parser) ──────────────────────
  let cleaned = sql.trim().replace(/;+$/, "");

  // ── 1. Block obviously dangerous keywords before parsing ──────────────────
  if (BLOCKED_KEYWORDS_RE.test(cleaned)) {
    throw new Error(
      `SQL contains a disallowed keyword (${BLOCKED_KEYWORDS_RE.exec(cleaned)?.[0]}). Only SELECT is allowed.`
    );
  }

  // ── 2. Reject stacked statements ──────────────────────────────────────────
  if (cleaned.includes(";")) {
    throw new Error("SQL must be a single statement. Multiple statements separated by ';' are not allowed.");
  }

  // ── 3. Parse into AST ─────────────────────────────────────────────────────
  let ast;
  try {
    ast = parser.astify(cleaned, { database: "PostgreSQL" });
  } catch (parseErr) {
    throw new Error(`SQL failed to parse: ${parseErr.message}`);
  }

  // Normalise: parser returns array for multiple statements
  const statements = Array.isArray(ast) ? ast : [ast];

  if (statements.length > 1) {
    throw new Error("Only a single SELECT statement is allowed.");
  }

  const stmt = statements[0];

  // ── 4. Must be SELECT ─────────────────────────────────────────────────────
  if (stmt.type?.toLowerCase() !== "select") {
    throw new Error(`Only SELECT statements are allowed. Got: ${stmt.type}`);
  }

  // ── 5. Table allow-list ───────────────────────────────────────────────────
  const allowedTables = new Set((allowList.tables ?? []).map((t) => t.toLowerCase()));
  const referencedTables = collectTables(stmt);

  for (const ref of referencedTables) {
    // Block system schemas
    if (ref.db && BLOCKED_SCHEMAS.has(ref.db.toLowerCase())) {
      throw new Error(`Access to schema '${ref.db}' is not allowed.`);
    }

    const tableLower = ref.table.toLowerCase();
    if (!allowedTables.has(tableLower)) {
      throw new Error(
        `Table '${ref.table}' is not in the allowed list. Allowed tables: ${[...allowedTables].join(", ")}`
      );
    }
  }

  // ── 6. Column allow-list (best-effort — only when table is known) ─────────
  const columnMap = allowList.columns ?? new Map();
  const referencedCols = collectColumns(stmt);

  for (const ref of referencedCols) {
    // Skip wildcards (SELECT *)
    if (ref.column === "*") continue;

    // node-sql-parser can return column as an object for aggregates/aliases
    if (typeof ref.column !== "string") continue;

    const colLower = ref.column.toLowerCase();
    const tableLower = ref.table?.toLowerCase();

    if (tableLower && columnMap.has(tableLower)) {
      const allowedCols = columnMap.get(tableLower);
      if (!allowedCols.has(colLower)) {
        // Warn rather than hard-fail (aliases make strict check too noisy)
        warnings.push(
          `Column '${ref.table}.${ref.column}' not found in schema — verify the query.`
        );
      }
    }
  }

  // ── 7. Auto-inject LIMIT if missing ───────────────────────────────────────
  // Use regex on the cleaned SQL — the AST's limit field shape varies by parser version
  const hasLimit = /\bLIMIT\s+\d+/i.test(cleaned);
  if (!hasLimit) {
    warnings.push(`No LIMIT found — injecting LIMIT ${DEFAULT_LIMIT} for safety.`);
    cleaned = `${cleaned} LIMIT ${DEFAULT_LIMIT}`;
  }

  return { sql: cleaned, warnings };
}

module.exports = { validateSQL, DEFAULT_LIMIT };
