# QUERYLINE — GenAI-Powered BI Dashboard

> Ask a plain-English business question. Get a live SQL-powered chart.

Queryline is a portfolio-grade BI dashboard where an LLM generates a validated SQL query against a real schema, and the result is rendered as an interactive chart — all in seconds.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (Vercel)                                               │
│  React + Vite + Tailwind CSS + Recharts                         │
│  "The Console" UI — persistent terminal strip + card grid       │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTPS / REST
┌───────────────────────▼─────────────────────────────────────────┐
│  Backend (Render.com)                                           │
│  Node.js + Express                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Schema Cache │  │ Prompt Build │  │ SQL Validation Layer │  │
│  │ (memory/Redis│  │ (few-shot +  │  │ (node-sql-parser AST │  │
│  │  Upstash)    │  │  schema)     │  │  + allow-list)       │  │
│  └──────────────┘  └──────┬───────┘  └──────────────────────┘  │
│                           │                                     │
│              ┌────────────▼──────────┐                         │
│              │  LLM: Groq (primary)  │                         │
│              │  + Gemini (fallback)  │                         │
│              └───────────────────────┘                         │
└───────────────────────┬─────────────────────────────────────────┘
                        │ pg / connection pooler
┌───────────────────────▼─────────────────────────────────────────┐
│  Supabase (PostgreSQL)                                          │
│  customers · products · orders · order_items                    │
│  Read-only connection · Row-level security                      │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer       | Technology                        | Hosting     |
|-------------|-----------------------------------|-------------|
| Frontend    | React 19 · Vite · Tailwind v4 · Recharts | Vercel |
| Backend     | Node.js · Express                 | Render.com  |
| Database    | Supabase (PostgreSQL)             | Supabase    |
| LLM Primary | Groq API (Llama 3.3 70B)         | Groq        |
| LLM Fallback| Google Gemini API (Flash)         | Google      |
| SQL Safety  | `node-sql-parser` (AST-based)     | —           |
| Auth        | Firebase Authentication (Google)  | Firebase    |
| Cache       | Upstash Redis                     | Upstash     |
| CI/CD       | GitHub Actions + Vercel/Render integrations | GitHub |

## Local Development

### Prerequisites
- Node.js ≥ 18
- A [Supabase](https://supabase.com) project (free tier)
- A [Groq](https://console.groq.com) API key (free tier)

### Setup

1. **Clone**
   ```bash
   git clone https://github.com/Venkkyyy/GenAI-Powered-BI-Dashboard-Text-to-SQL-Analytics-
   cd GenAI-Powered-BI-Dashboard-Text-to-SQL-Analytics-
   ```

2. **Seed the database**
   - Go to Supabase Dashboard → SQL Editor
   - Paste and run the contents of `db/seed.sql`

3. **Configure backend env**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your real Supabase URL and API keys
   ```

4. **Start backend**
   ```bash
   cd backend
   npm install
   npm run dev
   # → http://localhost:3001/api/health
   ```

5. **Start frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   # → http://localhost:5173
   ```

## Safety & Validation

Every LLM-generated SQL query is checked before execution:

- **AST parsing** via `node-sql-parser` — rejects non-parseable input immediately
- **SELECT-only** — any non-SELECT statement is rejected
- **Allow-list** — only the 4 schema tables and their known columns are permitted
- **Single statement** — stacked queries / semicolon injection rejected
- **Auto-LIMIT** — queries missing a LIMIT clause get `LIMIT 100` injected
- **Timeout** — queries exceeding 5s are cancelled
- **Read-only role** — DB connection has no write privileges

## Build Status

| Step | Description | Status |
|------|-------------|--------|
| 1 | Repo structure, DB schema, seed data, /api/health | ✅ |
| 2 | Schema introspection + LLM integration (Groq/Gemini) | ⬜ |
| 3 | SQL validation layer + unit tests | ⬜ |
| 4 | Query execution + chart-type auto-selection | ⬜ |
| 5 | Functional React UI wired to backend | ⬜ |
| 6 | Full design system + Compile Reveal animation | ⬜ |
| 7 | Firebase Auth (Google sign-in) | ⬜ |
| 8 | Production deploy (Supabase → Render → Vercel) | ⬜ |
| 9 | Upstash Redis caching + rate limiting | ⬜ |
| 10 | README polish, architecture diagram, demo GIF | ⬜ |

---

*See `PROJECT_LOG.md` for detailed session-by-session build history.*
