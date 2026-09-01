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

### [STEP 2] — Schema introspection + Groq/Gemini LLM integration
**Date:** 2026-08-29
**Status:** ✅ Complete

#### What was built
- `/backend/src/services/schemaService.js` — Queries `information_schema` for the 4 allowed tables. Formats schema into a concise DDL-like string for the LLM. Builds an `allowedColumns` map (table → Set<column>) for the validation layer. In-memory cache with 5-minute TTL. `refreshSchema()` for on-demand cache busting.
- `/backend/src/services/promptBuilder.js` — System prompt with: role, formatted schema, 5 hard rules (SELECT-only, allow-list, LIMIT required, no semicolons, ISO dates), 5 diverse few-shot NL→SQL examples (revenue, time-series, geographic, category, customer). Response format enforces strict JSON `{sql, explanation}`.
- `/backend/src/services/llmService.js` — Groq SDK (primary, llama-3.3-70b-versatile) + Google Gemini SDK (fallback, gemini-1.5-flash). JSON mode enabled on both. Defensive JSON parser strips markdown fences and validates `sql` field. Falls back to Gemini on any Groq error (especially 429).
- `/backend/src/routes/query.js` — `POST /api/query` (Step 2 version): validates input, fetches schema, builds prompt, calls LLM, logs to in-memory history. Returns `{ id, sql, explanation, provider, data: null, chartType: null }`. `data` and `chartType` will be populated in Step 4.
- `/backend/src/routes/schema.js` — `GET /api/schema` returns cached schema + `?refresh=1` for force-refresh.
- `/backend/src/index.js` — Removed 501 stubs; mounted real `queryRouter` and `schemaRouter`. Added real `GET /api/history` and `POST /api/feedback` (in-memory).

#### Key decisions
- Groq `response_format: { type: "json_object" }` + Gemini `responseMimeType: "application/json"` enforce structured output — reduces hallucination risk significantly.
- Temperature 0.1 on both providers for deterministic SQL.
- The `allowedColumns` map built in schemaService is already structured for the Step 3 validator — no refactor needed.
- `parseResponse()` defensively strips markdown code fences even with JSON mode active.
- Groq fallback triggers on ANY Groq error (not just 429) so the app degrades gracefully.

#### Verified by
- `node --check` passes on all 6 new/modified files — zero syntax errors.
- Server starts cleanly with `npm run dev`.
- With real API keys in `.env`, `POST /api/query {"question":"top 5 products by revenue"}` returns a valid SELECT statement.

#### Next
- **Step 3:** SQL validation layer with unit tests — AST parsing via `node-sql-parser`, allow-list enforcement, auto-LIMIT injection, injection attack tests.

---

### [STEP 3] — SQL Validation Layer
**Date:** 2026-09-02
**Status:** ✅ Complete

#### What was built
- `/backend/src/services/sqlValidator.js` — AST-level SQL validator using `node-sql-parser`. Enforces: SELECT-only, allow-list of 4 tables, allow-list of columns (warn-only for flexibility), blocks `information_schema`/`pg_catalog` access, blocks stacked statements (`;`), auto-injects `LIMIT 500` when missing.
- `/backend/tests/sqlValidator.test.js` — 20 unit tests covering happy paths, all DML types (INSERT/UPDATE/DELETE/DROP/TRUNCATE/CREATE), injection attacks, table allow-list, schema access, and return shape. **20/20 passing.**
- `/backend/src/routes/query.js` — Updated to call `validateSQL()` after LLM output. Returns 422 with human-readable `reason` on rejection.

#### Key decisions
- Column allow-list emits warnings, not hard errors — LLM-generated aliases and computed columns (e.g. `SUM(...) AS revenue`) would fail a strict check.
- LIMIT detection uses regex on the cleaned SQL string (not AST `.limit` field) — the AST representation of LIMIT is inconsistent across node-sql-parser versions.
- `typeof ref.column !== 'string'` guard needed because the parser returns column refs as objects for aggregate expressions.

#### Verified by
- `npm test` → 20/20 passing, 0.5s

---

### [STEP 4] — Query Execution + Chart Auto-Selection
**Date:** 2026-09-02
**Status:** ✅ Complete

#### What was built
- `/backend/src/services/chartAdvisor.js` — Inspects result row column names and values to auto-select chart type. Priority: `time_series` (date col + numeric) → `pie` (2 cols, ≤12 rows) → `bar` (string + numeric) → `scatter` (2 numeric) → `table` (fallback). Returns `{ chartType, columnMap }` describing axis/label roles.
- `/backend/src/routes/query.js` — Full pipeline: LLM → validateSQL → db.query → selectChartType → respond. Returns `{ sql, explanation, provider, data, chartType, columnMap, warnings, rowCount, executionMs }`.

#### Key decisions
- DB execution errors return 422 (not 500) with the pg error message so the frontend can display it as a user-facing error, not a system crash.
- Chart selection is intentional heuristic — bar is preferred over pie for >12 rows.

---

### [STEP 5] — React UI (v1 scaffold → v2 Gemini-style redesign)
**Date:** 2026-09-02
**Status:** ✅ Complete

#### What was built
- **Design system v2** (`style.css`) — Gemini-inspired dark surfaces (`#0d0d0d`), dot-grid background pattern, gradient tokens (`--grad-brand`, `--grad-text`, `--grad-cool`), glassmorphism surfaces with `backdrop-filter`, shimmer skeleton animation, slide-up card entrance, amber glow effects.
- **`Sidebar.jsx`** — Fixed 260px left sidebar: gradient Q logo, "New query" pill button, history list with click-to-re-run, sign-in footer.
- **`InputBar.jsx`** — Bottom-docked auto-grow textarea (Gemini style): gradient border on focus, amber glow send button, inline suggestion chips, SQL typewriter strip above the bar.
- **`ResultCard.jsx` v2** — Glassmorphism card: gradient top bar (amber→purple), chart type chip, Recharts embed, collapsible SQL panel with copy button, SVG thumbs feedback, row count + execution time.
- **`QueryChart.jsx`** — Recharts bar/line/pie/scatter/table with design system colors.
- **`sqlHighlight.jsx`** — SQL tokenizer returning JSX with amber keywords and blue identifiers.
- **`App.jsx` v2** — Gemini-style layout: fixed sidebar + scrollable main + fixed bottom input. Empty state with suggestion grid (icon + label cards). Loading skeleton cards. 2-col result grid.

#### Key decisions
- Input bar moved to bottom (Gemini convention) instead of top terminal strip.
- Suggestion chips shown inline inside the input bar when empty.
- Empty state shows a 2×3 grid of suggestion cards with icons — more discoverable than a text prompt.
- `backdrop-filter: blur` glassmorphism on all surface cards.
- `Google Sans` / `Google Sans Mono` fonts via Google Fonts to match Gemini aesthetic.

#### Next
- **Step 6:** Firebase Auth — Google sign-in only. Protect `/api/*` routes with a JWT middleware.
- **Step 7:** Deploy — Supabase (already live) → Render (backend) → Vercel (frontend).

---
