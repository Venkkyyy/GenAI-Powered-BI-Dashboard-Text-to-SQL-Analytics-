/**
 * routes/schema.js — GET /api/schema
 *
 * Returns the cached schema (table names, columns, types).
 * Used by the frontend schema panel so users can see what's available.
 * Accepts ?refresh=1 to force a cache bust.
 */

const express = require("express");
const { getSchema, refreshSchema } = require("../services/schemaService");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const forceRefresh = req.query.refresh === "1";
    const schema = forceRefresh ? await refreshSchema() : await getSchema();

    res.json({
      tables: schema.allowedTables,
      schema: schema.raw,
      formattedSchema: schema.formatted,
      cachedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
