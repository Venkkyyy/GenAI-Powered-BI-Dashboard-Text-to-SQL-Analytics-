# PROJECT_LOG.md — Queryline

> **Single source of truth for AI assistants.** Read this before starting any task. Append a new entry after every task. Never delete or rewrite existing entries.

---

## Log Format
```
### [STEP X] — <Short Title>
**Date:** YYYY-MM-DD
**Status:** ✅ Complete | 🔄 In Progress | ❌ Blocked

#### What was built
- Bullet list of files created/modified

#### Key decisions
- Rationale for any non-obvious choices

#### Verified by
- How we confirmed it works

#### Next
- What comes next (Section 6 step reference)
```

---

### [STEP 1] — Repo structure, DB schema, seed data, Express /api/health
**Date:** 2026-08-29
**Status:** ✅ Complete

#### What was built
- `/backend/src/index.js` — Express server (PORT 3001), CORS, JSON body parser, request logger, global error handler. Stub 501 routes for future steps.
- `/backend/src/db.js` — `pg` Pool wrapper with `query()` helper and `ping()` for health checks. SSL enabled in production (required by Supabase).
- `/backend/src/routes/health.js` — `GET /api/health` returns `{ status, checks.database, timestamp }`. Returns 200 if DB is reachable, 503 if not.
- `/backend/package.json` — express, pg, dotenv, cors; jest + nodemon + supertest for dev/test.
- `/backend/.env.example` — Template with all required env var names and comments. No real secrets.
- `/backend/.gitignore` — excludes .env and node_modules
- `/db/seed.sql` — Idempotent SQL: creates 4 tables (customers, products, orders, order_items), seeds 50 customers (6 regions), 30 products (5 categories), ~300 orders with 1–4 items each via PL/pgSQL with `setseed(0.42)` for reproducibility.
- `/frontend/` — Vite scaffold + React 19 + Tailwind CSS v4 + Recharts + Axios installed.
- `/frontend/vite.config.js` — Tailwind v4 plugin + dev proxy `/api` → `localhost:3001`.
- `/frontend/index.html` — IBM Plex Mono + IBM Plex Sans from Google Fonts, proper meta tags.
- `/frontend/src/style.css` — Tailwind import + full CSS custom property design system (all 8 color tokens, both fonts), amber cursor blink animation.
- `/frontend/src/App.jsx` — Holding screen that pings `/api/health` and displays result. Confirms E2E connectivity.
- `/.gitignore` — Root-level: excludes .env, node_modules, build outputs, IDE files.
- `/README.md` — Skeleton with project description and local dev instructions.
- `/PROJECT_LOG.md` — This file.

#### Key decisions
- Used `pg` directly (not an ORM) — schema is small and fixed; we need raw SQL access for the introspection service anyway.
- SSL is `false` in development (avoids self-signed cert issues locally) and `{ rejectUnauthorized: false }` in production (Supabase pooler requirement).
- Tailwind v4 uses the `@tailwindcss/vite` plugin pattern — no `tailwind.config.js` needed.
- Frontend stack: React 19 (latest stable), Recharts 3, Axios.
- Vite dev server proxies `/api/*` to Express, so no CORS issues in local dev.
- Seed uses `setseed(0.42)` for reproducible random data; `ON CONFLICT DO NOTHING` on order_items prevents duplicate (order_id, product_id) pairs if re-run.

#### Verified by
- `npm install` completed successfully in both `/backend` and `/frontend`.
- `GET /api/health` returns `{ status: "degraded", checks: { database: "unreachable" } }` locally without a real Supabase URL (correct — DB not yet configured).
- After user sets `DATABASE_URL` in `/backend/.env`, the health check should return `status: "ok"`.

#### Next
- **Step 1 action required:** User must:
  1. Run `/db/seed.sql` against their Supabase project (Supabase Dashboard → SQL Editor, paste and run).
  2. Copy `/backend/.env.example` to `/backend/.env` and fill in `DATABASE_URL`.
  3. Run `npm run dev` in `/backend` and `npm run dev` in `/frontend` to verify E2E health check.
  4. Commit Step 1 files, then signal ready for **Step 2**: Schema introspection + LLM integration.

---
