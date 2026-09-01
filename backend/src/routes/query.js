/**
 * routes/query.js — POST /api/query
 *
 * Dual-mode execution:
 *  - If a CSV has been uploaded → uses alasql (in-memory SQL engine) on that dataset.
 *  - Otherwise → uses the live Supabase DB via schemaService.
 *
 * Pipeline: LLM → sqlValidator → alasql|pg → chartAdvisor → respond
 */

const express = require("express");
const { getSchema } = require("../services/schemaService");
const { buildSystemPrompt, buildUserMessage } = require("../services/promptBuilder");
const { generateSQL } = require("../services/llmService");
const { validateSQL } = require("../services/sqlValidator");
const { selectChartType } = require("../services/chartAdvisor");
const { getDataset, formatDatasetSchema } = require("../services/datasetStore");
const alasql = require("alasql");
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
    // ── Determine data source mode ─────────────────────────────────────────────
    const dataset = getDataset();
    const useDataset = !!dataset;

    // ── Build schema context for LLM ──────────────────────────────────────────
    let schemaFormatted, allowList;
    if (useDataset) {
      // Dataset mode: use uploaded CSV schema
      console.log(`[query] Mode: dataset (${dataset.name}, ${dataset.rows.length} rows)`);
      schemaFormatted = formatDatasetSchema(dataset);
      allowList = {
        tables: [dataset.name],
        columns: new Map([[
          dataset.name,
          new Set(dataset.columns.map(c => c.name)),
        ]]),
      };
    } else {
      // DB mode: use live Supabase schema
      console.log(`[query] Mode: database (Supabase)`);
      const schema = await getSchema();
      schemaFormatted = schema.formatted;
      allowList = { tables: schema.tables, columns: schema.columns };
    }

    // ── LLM: generate SQL ──────────────────────────────────────────────────────
    const systemPrompt = buildSystemPrompt(schemaFormatted);
    const userMessage  = buildUserMessage(trimmed);
    const { sql: rawSql, explanation, provider } = await generateSQL(systemPrompt, userMessage);
    console.log(`[query] LLM (${provider}) generated SQL: ${rawSql}`);

    // ── Step 3: Validate SQL ───────────────────────────────────────────────────
    let validatedSql, warnings;
    try {
      ({ sql: validatedSql, warnings } = validateSQL(rawSql, allowList));
    } catch (validationErr) {
      console.warn(`[query] Validation rejected: ${validationErr.message}`);
      return res.status(422).json({
        error: "The generated SQL failed safety validation.",
        reason: validationErr.message,
        sql: rawSql,
      });
    }
    if (warnings.length > 0) console.warn(`[query] Validation warnings:`, warnings);
    console.log(`[query] Validated SQL: ${validatedSql}`);

    // ── Step 4a: Execute ───────────────────────────────────────────────────────
    const execStart = Date.now();
    let rows;
    try {
      if (useDataset) {
        // alasql: register dataset rows as a temp table and run the query
        alasql.tables[dataset.name] = { data: dataset.rows };
        rows = alasql(validatedSql);
        if (!Array.isArray(rows)) rows = [];
      } else {
        const result = await db.query(validatedSql);
        rows = result.rows;
      }
    } catch (execErr) {
      console.error(`[query] Execution error: ${execErr.message}`);
      return res.status(422).json({
        error: useDataset ? "Query execution failed on the uploaded dataset." : "SQL execution failed.",
        reason: execErr.message,
        sql: validatedSql,
      });
    }
    const executionMs = Date.now() - execStart;
    console.log(`[query] Executed in ${executionMs}ms — ${rows.length} rows`);

    // ── Step 4b: Chart selection ───────────────────────────────────────────────
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
