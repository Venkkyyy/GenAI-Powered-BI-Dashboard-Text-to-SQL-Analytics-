/**
 * services/chartAdvisor.js
 *
 * Step 4 — Chart Type Auto-Selection
 *
 * Given the shape of the query result rows, suggests the most appropriate
 * Recharts chart type for the frontend to render.
 *
 * Selection logic (in priority order):
 *  1. time_series   — result has a date/time column + one or more numeric columns
 *  2. bar           — one categorical column + one numeric column (most common BI shape)
 *  3. pie           — exactly 2 columns: one label + one numeric, ≤ 12 rows
 *  4. scatter       — exactly two numeric columns
 *  5. table         — fallback for anything else
 *
 * Returns a chartType string and a columnMap describing which columns
 * play which roles (x-axis, y-axis, label, value, etc.).
 */

// ── Type detection helpers ────────────────────────────────────────────────────

const DATE_COLUMN_RE =
  /\b(date|time|month|week|year|day|period|created|updated|at|ts|timestamp)\b/i;

const NUMERIC_COLUMN_RE =
  /\b(count|sum|total|revenue|amount|qty|quantity|price|avg|average|rate|value|num|number|pct|percent)\b/i;

/**
 * Infer the broad type of a column value.
 * @param {*} value - A sample value from the column.
 * @returns {"date"|"number"|"string"}
 */
function inferValueType(value) {
  if (value === null || value === undefined) return "string";
  if (value instanceof Date) return "date";
  if (typeof value === "number") return "number";
  if (typeof value === "string") {
    // ISO date / timestamp strings
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return "date";
    // Numeric strings (e.g. aggregates returned as strings by pg)
    if (/^-?\d+(\.\d+)?$/.test(value)) return "number";
  }
  return "string";
}

/**
 * Classify each column in the result set.
 * @param {object[]} rows - Array of result row objects.
 * @returns {Array<{ key: string, type: "date"|"number"|"string" }>}
 */
function classifyColumns(rows) {
  if (!rows || rows.length === 0) return [];

  const keys = Object.keys(rows[0]);
  // Sample up to first 5 rows for type inference
  const samples = rows.slice(0, 5);

  return keys.map((key) => {
    // Prefer non-null samples
    const sample = samples.map((r) => r[key]).find((v) => v !== null && v !== undefined);

    // Hint from column name first
    const nameLower = key.toLowerCase();
    let type;
    if (DATE_COLUMN_RE.test(nameLower)) {
      type = "date";
    } else if (NUMERIC_COLUMN_RE.test(nameLower)) {
      type = "number";
    } else {
      type = inferValueType(sample);
    }

    return { key, type };
  });
}

// ── Chart selection ───────────────────────────────────────────────────────────

/**
 * Auto-select the best chart type for the given result rows.
 *
 * @param {object[]} rows - Query result rows.
 * @returns {{
 *   chartType: "time_series"|"bar"|"pie"|"scatter"|"table",
 *   columnMap: {
 *     xAxis?: string,
 *     yAxis?: string|string[],
 *     label?: string,
 *     value?: string,
 *   }
 * }}
 */
function selectChartType(rows) {
  if (!rows || rows.length === 0) {
    return { chartType: "table", columnMap: {} };
  }

  const columns = classifyColumns(rows);
  const dateCols = columns.filter((c) => c.type === "date");
  const numericCols = columns.filter((c) => c.type === "number");
  const stringCols = columns.filter((c) => c.type === "string");

  // ── 1. Time series ─────────────────────────────────────────────────────────
  if (dateCols.length >= 1 && numericCols.length >= 1) {
    return {
      chartType: "time_series",
      columnMap: {
        xAxis: dateCols[0].key,
        yAxis: numericCols.map((c) => c.key),
      },
    };
  }

  // ── 2. Pie chart ───────────────────────────────────────────────────────────
  // Best for exactly 1 label + 1 value with few rows
  if (
    columns.length === 2 &&
    stringCols.length === 1 &&
    numericCols.length === 1 &&
    rows.length <= 12
  ) {
    return {
      chartType: "pie",
      columnMap: {
        label: stringCols[0].key,
        value: numericCols[0].key,
      },
    };
  }

  // ── 3. Bar chart ───────────────────────────────────────────────────────────
  if (stringCols.length >= 1 && numericCols.length >= 1) {
    return {
      chartType: "bar",
      columnMap: {
        xAxis: stringCols[0].key,
        yAxis: numericCols.map((c) => c.key),
      },
    };
  }

  // ── 4. Scatter plot ────────────────────────────────────────────────────────
  if (numericCols.length >= 2) {
    return {
      chartType: "scatter",
      columnMap: {
        xAxis: numericCols[0].key,
        yAxis: numericCols[1].key,
      },
    };
  }

  // ── 5. Fallback: table ─────────────────────────────────────────────────────
  return { chartType: "table", columnMap: {} };
}

module.exports = { selectChartType, classifyColumns };
