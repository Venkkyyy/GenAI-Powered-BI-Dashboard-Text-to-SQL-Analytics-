/**
 * App.jsx — Queryline root component (Step 5 — Full UI)
 *
 * Layout:
 *   ┌─────────────────────────────────────────────────────┐
 *   │  Top Nav  (QUERYLINE wordmark + sign-in placeholder)│
 *   ├─────────────────────────────────────────────────────┤
 *   │  Console Strip  (persistent terminal prompt)        │
 *   ├──────────┬──────────────────────────────────────────┤
 *   │ History  │  Result card grid                        │
 *   │  Rail    │  (or empty state)                        │
 *   └──────────┴──────────────────────────────────────────┘
 */
import React, { useCallback, useRef, useState } from 'react';
import ConsoleStrip from './components/ConsoleStrip';
import HistoryRail  from './components/HistoryRail';
import ResultCard   from './components/ResultCard';

/* ── Inline styles (no Tailwind needed) ─────────────────────────────────── */

const NAV = {
  background: 'var(--surface)',
  borderBottom: '1px solid var(--border-hairline)',
  padding: '0 1.5rem',
  height: 48,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'sticky',
  top: 0,
  zIndex: 200,
};

const WORDMARK = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.95rem',
  fontWeight: 600,
  letterSpacing: '0.2em',
  color: 'var(--accent-amber)',
  userSelect: 'none',
};

const BODY = {
  display: 'flex',
  gap: '1rem',
  padding: '1rem 1.25rem',
  maxWidth: 1300,
  margin: '0 auto',
  minHeight: 'calc(100vh - 130px)',
  alignItems: 'flex-start',
};

const GRID = {
  flex: 1,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 480px), 1fr))',
  gap: '1rem',
  alignContent: 'start',
};

const EMPTY_STATE = {
  gridColumn: '1 / -1',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1rem',
  padding: '4rem 2rem',
  color: 'var(--text-muted)',
  textAlign: 'center',
};

const SUGGESTION_CHIP = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  background: 'var(--surface)',
  border: '1px solid var(--border-hairline)',
  borderRadius: 'var(--radius-sm)',
  padding: '0.4rem 0.85rem',
  cursor: 'pointer',
  transition: 'border-color var(--transition-fast), color var(--transition-fast)',
  display: 'inline-block',
};

const SUGGESTIONS = [
  "top 5 products by revenue",
  "monthly revenue trend this year",
  "orders by country",
  "customers by loyalty tier",
  "average order value by product category",
];

/* ── Component ───────────────────────────────────────────────────────────── */

export default function App() {
  const [results,  setResults]  = useState([]);    // array of result objects
  const [loading,  setLoading]  = useState(false);
  const [lastSQL,  setLastSQL]  = useState(null);  // for typewriter animation
  const [error,    setError]    = useState(null);  // toast error message
  const gridRef = useRef(null);

  /* ── Send question to backend ─────────────────────────────────────────── */
  const submitQuestion = useCallback(async (question) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setLastSQL(null); // reset typewriter

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      const json = await res.json();

      if (!res.ok) {
        // Surface validation / server errors gracefully
        setError(json.reason ?? json.error ?? "Can't run that safely. Try rephrasing, or check the schema panel for what's available.");
        setLoading(false);
        return;
      }

      setLastSQL(json.sql);
      setResults(prev => [json, ...prev]);

      // Scroll result grid into view on mobile
      setTimeout(() => {
        gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } catch {
      setError("Connection error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [loading]);

  /* ── Dismiss error ────────────────────────────────────────────────────── */
  function dismissError() { setError(null); }

  return (
    <>
      {/* ── Top Nav ──────────────────────────────────────────────────────── */}
      <nav style={NAV} aria-label="Main navigation">
        <span style={WORDMARK}>QUERYLINE</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px 8px',
          }}>v0.5-beta</span>
          <button
            id="sign-in-btn"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 12px',
              background: 'none',
              cursor: 'pointer',
              transition: 'color var(--transition-fast), border-color var(--transition-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-amber)'; e.currentTarget.style.borderColor = 'var(--accent-amber)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-hairline)'; }}
          >
            sign in
          </button>
        </div>
      </nav>

      {/* ── Console Strip ─────────────────────────────────────────────────── */}
      <ConsoleStrip onSubmit={submitQuestion} loading={loading} lastSQL={lastSQL} />

      {/* ── Error toast ───────────────────────────────────────────────────── */}
      {error && (
        <div role="alert" style={{
          maxWidth: 900,
          margin: '0.75rem auto',
          padding: '0.65rem 1rem',
          background: 'rgba(255,107,107,0.1)',
          border: '1px solid rgba(255,107,107,0.3)',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem',
          color: 'var(--error)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <span>⚠ {error}</span>
          <button onClick={dismissError} className="btn-ghost" style={{ color: 'var(--error)', flexShrink: 0 }}>✕</button>
        </div>
      )}

      {/* ── Main body ─────────────────────────────────────────────────────── */}
      <div style={BODY}>
        {/* History rail */}
        <HistoryRail
          history={results.map(r => ({ id: r.id, question: r.question, askedAt: r.askedAt }))}
          onSelect={submitQuestion}
        />

        {/* Result grid */}
        <main style={GRID} ref={gridRef} id="result-grid" aria-label="Query results">
          {results.length === 0 && !loading && (
            <div style={EMPTY_STATE}>
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
              }}>
                No questions asked yet.
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--text-muted)', opacity: 0.7 }}>
                Try one of these:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', maxWidth: 560 }}>
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    style={SUGGESTION_CHIP}
                    onClick={() => submitQuestion(s)}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-amber)'; e.currentTarget.style.color = 'var(--accent-amber)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-hairline)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading skeleton card */}
          {loading && (
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-hairline)',
              borderTop: '2px solid var(--accent-amber)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-amber)' }}>
                  #{results.length + 1}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  running<span className="cursor-blink" />
                </span>
              </div>
              {/* Skeleton bars */}
              {[100, 70, 85, 60].map((w, i) => (
                <div key={i} style={{
                  height: 8, borderRadius: 4, marginBottom: 10,
                  background: 'var(--surface-raised)',
                  width: `${w}%`,
                  animation: 'none',
                }} />
              ))}
            </div>
          )}

          {/* Actual result cards */}
          {results.map((r, i) => (
            <ResultCard key={r.id ?? i} result={r} index={r.id ?? (results.length - i)} />
          ))}
        </main>
      </div>
    </>
  );
}
