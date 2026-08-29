/**
 * routes/health.js — GET /api/health
 * Returns service status and DB connectivity.
 */

const express = require("express");
const { ping } = require("../db");

const router = express.Router();

router.get("/", async (_req, res) => {
  const dbOk = await ping();
  const status = dbOk ? "ok" : "degraded";

  res.status(dbOk ? 200 : 503).json({
    status,
    service: "queryline-backend",
    version: process.env.npm_package_version ?? "1.0.0",
    timestamp: new Date().toISOString(),
    checks: {
      database: dbOk ? "connected" : "unreachable",
    },
  });
});

module.exports = router;
