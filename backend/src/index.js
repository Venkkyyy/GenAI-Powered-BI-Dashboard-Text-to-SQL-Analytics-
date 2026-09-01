/**
 * index.js — Queryline Express server entry point
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const healthRouter = require("./routes/health");
const queryRouter  = require("./routes/query");
const schemaRouter = require("./routes/schema");

const app = express();
const PORT = process.env.PORT ?? 3001;

// ── Middleware ──────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));

// Request logger (dev only)
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ── Routes ──────────────────────────────────────────────────────────────────

app.use("/api/health",  healthRouter);
app.use("/api/query",   queryRouter);
app.use("/api/schema",  schemaRouter);

// History — reads from the in-memory store in query.js
app.get("/api/history", (req, res) => {
  const history = queryRouter.getHistory();
  const limit = Math.min(parseInt(req.query.limit ?? "20", 10), 100);
  res.json({ history: history.slice(-limit).reverse() });
});

// Feedback — stores thumbs up/down against a query id (Step 7 will persist to DB)
const _feedback = {};
app.post("/api/feedback", (req, res) => {
  const { id, vote } = req.body;
  if (!id || !["up", "down"].includes(vote)) {
    return res.status(400).json({ error: "Body must include 'id' and vote: 'up'|'down'" });
  }
  _feedback[id] = vote;
  res.json({ ok: true, id, vote });
});

// 404 catch-all
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler — shows real message in dev, generic in prod
app.use((err, _req, res, _next) => {
  console.error("[server] Unhandled error:", err.message ?? err);
  const isDev = process.env.NODE_ENV !== "production";
  res.status(500).json({
    error: isDev ? err.message ?? "Internal server error" : "Internal server error",
  });
});

// ── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 Queryline backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Environment:  ${process.env.NODE_ENV ?? "development"}\n`);
});

module.exports = app; // exported for testing
