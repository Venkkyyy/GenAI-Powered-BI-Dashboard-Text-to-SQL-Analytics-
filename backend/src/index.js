/**
 * index.js — Queryline Express server entry point
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const healthRouter = require("./routes/health");

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

app.use("/api/health", healthRouter);

// Stubs for future steps — returns 501 so the frontend knows they're not wired yet
const stub = (name) => (_req, res) =>
  res.status(501).json({ error: `${name} not implemented yet` });

app.post("/api/query", stub("POST /api/query"));
app.get("/api/schema", stub("GET /api/schema"));
app.get("/api/history", stub("GET /api/history"));
app.post("/api/feedback", stub("POST /api/feedback"));

// 404 catch-all
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("[server] Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 Queryline backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Environment:  ${process.env.NODE_ENV ?? "development"}\n`);
});

module.exports = app; // exported for testing
