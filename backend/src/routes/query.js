/**
 * routes/query.js — POST /api/query
 *
 * Step 2+3+4 implementation:
 *  2. LLM generates SQL from the user's natural-language question.
 *  3. sqlValidator validates & sanitizes the generated SQL (AST-level).
 *  4. Validated SQL is executed against the Supabase DB; results are shaped
 *     and a chart type is auto-selected by chartAdvisor.
 *
 * Response shape:
 *  {
 *    id, question, sql, explanation, provider,
 *    data: Row[],
 *    chartType: "bar"|"time_series"|"pie"|"scatter"|"table",
 *    columnMap: { xAxis, yAxis, label, value },
 *    warnings: string[],
 *    rowCount: number,
 *    executionMs: number,
 *    askedAt: ISO string
 *  }
 */

const express = require("express");
const { getSchema } = require("../services/schemaService");
const { buildSystemPrompt, buildUserMessage } = require("../services/promptBuilder");
const { generateSQL } = require("../services/llmService");
const { validateSQL } = require("../services/sqlValidator");
const { selectChartType } = require("../services/chartAdvisor");
const db = require("../db");

const router = express.Router();

// In-memory session history
const _history = [];

router.post("/", async (req, res, next) => {
  const startedAt = new Date().toISOString();
  const { question } = req.body;

  // ── Input validation ─────────────────────────────────────────────────────────
  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Body must include a non-empty 'question' string." });
  }
  const trimmed = question.trim();
  if (trimmed.length === 0) {
    return res.status(400).json({ error: "'question' must not be empty." });
  }
  if (trimmed.length > 500) {
    return res.status(400).json({ error: "'question' must be 500 characters or fewer." });
  }

  console.log(`[query] Question: "${trimmed}"`);

  try {
    // ── Step 2a: Fetch live schema ─────────────────────────────────────────────
    const schema = await getSchema();

    // ── Step 2b: Build prompt + call LLM ──────────────────────────────────────
    const systemPrompt = buildSystemPrompt(schema.formatted);
    const userMessage = buildUserMessage(trimmed);
    const { sql: rawSql, explanation, provider } = await generateSQL(systemPrompt, userMessage);

    console.log(`[query] LLM (${provider}) generated SQL: ${rawSql}`);

    // ── Step 3: Validate & sanitize SQL ───────────────────────────────────────
    let validatedSql, warnings;
    try {
      ({ sql: validatedSql, warnings } = validateSQL(rawSql, {
        tables: schema.tables,
        columns: schema.columns,
      }));
    } catch (validationErr) {
      console.warn(`[query] SQL validation rejected query: ${validationErr.message}`);
      return res.status(422).json({
        error: "The generated SQL failed safety validation.",
        reason: validationErr.message,
        sql: rawSql,
      });
    }

    if (warnings.length > 0) {
      console.warn(`[query] SQL validation warnings:`, warnings);
    }

    console.log(`[query] Validated SQL: ${validatedSql}`);

    // ── Step 4a: Execute against the database ──────────────────────────────────
    const execStart = Date.now();
    let rows;
    try {
      const result = await db.query(validatedSql);
      rows = result.rows;
    } catch (dbErr) {
      console.error(`[query] DB execution error: ${dbErr.message}`);
      return res.status(422).json({
        error: "SQL execution failed.",
        reason: dbErr.message,
        sql: validatedSql,
      });
    }
    const executionMs = Date.now() - execStart;

    console.log(`[query] Executed in ${executionMs}ms — ${rows.length} rows returned`);

    // ── Step 4b: Auto-select chart type ───────────────────────────────────────
    const { chartType, columnMap } = selectChartType(rows);

    console.log(`[query] Auto-selected chart: ${chartType}`);

    // ── Log to history ─────────────────────────────────────────────────────────
    const entry = {
      id: _history.length + 1,
      question: trimmed,
      sql: validatedSql,
      explanation,
      provider,
      chartType,
      rowCount: rows.length,
      status: "executed",
      askedAt: startedAt,
    };
    _history.push(entry);

    // ── Respond ────────────────────────────────────────────────────────────────
    return res.json({
      id: entry.id,
      question: trimmed,
      sql: validatedSql,
      explanation,
      provider,
      data: rows,
      chartType,
      columnMap,
      warnings,
      rowCount: rows.length,
      executionMs,
      askedAt: startedAt,
    });
  } catch (err) {
    console.error(`[query] Error for question "${trimmed}":`, err.message);
    next(err);
  }
});

// Expose history array for the GET /api/history route in index.js
function getHistory() {
  return _history;
}

module.exports = router;
module.exports.getHistory = getHistory;
