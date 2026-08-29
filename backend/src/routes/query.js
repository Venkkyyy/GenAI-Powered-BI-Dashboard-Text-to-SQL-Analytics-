/**
 * routes/query.js — POST /api/query
 *
 * Step 2 implementation: accepts { question }, returns { sql, explanation, provider }.
 * Query execution (data + chartType) is added in Step 4 after the validation
 * layer (Step 3) is in place.
 *
 * Logs: question → generated SQL → provider for every request.
 */

const express = require("express");
const { getSchema } = require("../services/schemaService");
const { buildSystemPrompt, buildUserMessage } = require("../services/promptBuilder");
const { generateSQL } = require("../services/llmService");

const router = express.Router();

// In-memory session history (Step 3/4 will expand this)
const _history = [];

router.post("/", async (req, res, next) => {
  const startedAt = new Date().toISOString();
  const { question } = req.body;

  // ── Input validation ───────────────────────────────────────────────────────
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
    // ── 1. Get live schema ───────────────────────────────────────────────────
    const schema = await getSchema();

    // ── 2. Build prompt ──────────────────────────────────────────────────────
    const systemPrompt = buildSystemPrompt(schema.formatted);
    const userMessage = buildUserMessage(trimmed);

    // ── 3. Call LLM ──────────────────────────────────────────────────────────
    const { sql, explanation, provider } = await generateSQL(systemPrompt, userMessage);

    console.log(`[query] Generated SQL (via ${provider}): ${sql}`);

    // ── 4. Log to history ────────────────────────────────────────────────────
    const entry = {
      id: _history.length + 1,
      question: trimmed,
      sql,
      explanation,
      provider,
      status: "sql_generated", // will become "executed" after Step 4
      askedAt: startedAt,
    };
    _history.push(entry);

    // ── 5. Respond ───────────────────────────────────────────────────────────
    // NOTE: 'data' and 'chartType' are null until Step 4 (query execution).
    return res.json({
      id: entry.id,
      sql,
      explanation,
      provider,
      data: null,
      chartType: null,
      askedAt: startedAt,
    });
  } catch (err) {
    console.error(`[query] Error for question "${trimmed}":`, err.message);
    next(err);
  }
});

// Expose history array for the GET /api/history route
function getHistory() {
  return _history;
}

module.exports = router;
module.exports.getHistory = getHistory;
