/**
 * App.jsx — Queryline v2 (Gemini-style layout)
 *
 * ┌───────────────────────────────────────────────────┐
 * │  Sidebar (fixed left, 260px)                      │
 * │  ┌─────────────────────────────────────────────┐  │
 * │  │  Main scrollable content area               │  │
 * │  │  ┌───────────────────────────────────────┐  │  │
 * │  │  │  Empty / Result cards (2-col grid)    │  │  │
 * │  │  └───────────────────────────────────────┘  │  │
 * │  │  ┌───────────────────────────────────────┐  │  │
 * │  │  │  Bottom Input Bar (fixed)             │  │  │
 * │  │  └───────────────────────────────────────┘  │  │
 * │  └─────────────────────────────────────────────┘  │
 * └───────────────────────────────────────────────────┘
 */
import React, { useCallback, useRef, useState } from 'react';
import Sidebar    from './components/Sidebar';
import InputBar   from './components/InputBar';
import ResultCard from './components/ResultCard';

const SUGGESTIONS_ALL = [
  { label: "Top 5 products by revenue", icon: "🏆" },
  { label: "Monthly revenue trend",     icon: "📈" },
  { label: "Orders by country",         icon: "🌍" },
  { label: "Customers by loyalty tier", icon: "⭐" },
  { label: "Avg order value by category", icon: "💰" },
  { label: "Products low in stock",     icon: "📦" },
];

export default function App() {
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [lastSQL,  setLastSQL]  = useState(null);
  const [error,    setError]    = useState(null);
  const [counter,  setCounter]  = useState(0);
  const topRef = useRef(null);

  const submitQuestion = useCallback(async (question) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setLastSQL(null);

    try {
      const res  = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.reason ?? json.error ?? "Can't run that safely. Try rephrasing.");
        setLoading(false);
        return;
      }

      setLastSQL(json.sql);
      const id = counter + 1;
      setCounter(id);
      setResults(prev => [{ ...json, id, askedAt: json.askedAt ?? new Date().toISOString() }, ...prev]);
      setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch {
      setError('Connection error — is the backend running on port 3001?');
    } finally {
      setLoading(false);
    }
  }, [loading, counter]);

  function clearAll() {
    setResults([]);
    setLastSQL(null);
    setError(null);
    setCounter(0);
  }

  const isEmpty = results.length === 0 && !loading;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <Sidebar
        history={results.map(r => ({ id: r.id, question: r.question, askedAt: r.askedAt }))}
        onNew={clearAll}
        onSelect={submitQuestion}
      />

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="main-content" style={{
        marginLeft: 260,
        flex: 1,
        minHeight: '100vh',
        paddingBottom: 220, // space for input bar
        paddingTop: '2rem',
        paddingLeft: '2rem',
        paddingRight: '2rem',
        maxWidth: '100%',
        position: 'relative',
      }}>

        {/* ── Empty state ─────────────────────────────────────────────── */}
        {isEmpty && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: 'calc(100vh - 260px)',
            gap: '2rem', textAlign: 'center',
          }}>
            {/* Logo mark */}
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: 'var(--grad-brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem', fontWeight: 700,
              fontFamily: 'var(--font-mono)', color: '#000',
              boxShadow: 'var(--glow-amber)',
            }}>Q</div>

            <div>
              <h1 style={{
                fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem',
                background: 'var(--grad-text)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                What do you want to know?
              </h1>
              <p style={{ color: 'var(--text-2)', fontSize: '0.95rem' }}>
                Ask a plain-English question — Queryline generates SQL and charts the answer instantly.
              </p>
            </div>

            {/* Suggestion grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.75rem', width: '100%', maxWidth: 720,
            }}>
              {SUGGESTIONS_ALL.map(s => (
                <button
                  key={s.label}
                  onClick={() => submitQuestion(s.label)}
                  style={{
                    textAlign: 'left',
                    background: 'var(--glass)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-lg)',
                    padding: '0.85rem 1rem',
                    cursor: 'pointer',
                    transition: 'all var(--t-mid)',
                    display: 'flex', flexDirection: 'column', gap: '0.35rem',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,180,84,0.4)';
                    e.currentTarget.style.background = 'var(--surface-hover)';
                    e.currentTarget.style.boxShadow = 'var(--glow-amber)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background = 'var(--glass)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.4 }}>
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Error toast ─────────────────────────────────────────────── */}
        {error && (
          <div role="alert" className="fade-in" style={{
            maxWidth: 760, margin: '0 auto 1rem',
            padding: '0.75rem 1rem',
            background: 'rgba(255,100,100,0.08)',
            border: '1px solid rgba(255,100,100,0.25)',
            borderRadius: 'var(--r-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
            fontSize: '0.82rem', color: '#ff8080',
          }}>
            <span>⚠ {error}</span>
            <button
              onClick={() => setError(null)}
              style={{ background: 'none', border: 'none', color: '#ff8080', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
            >✕</button>
          </div>
        )}

        {/* ── Loading skeleton ─────────────────────────────────────────── */}
        {loading && (
          <div ref={topRef} style={{
            maxWidth: 760, margin: '0 auto 1rem',
            background: 'var(--glass)', backdropFilter: 'blur(12px)',
            border: '1px solid var(--border)', borderRadius: 'var(--r-xl)',
            overflow: 'hidden', padding: '1.25rem 1.5rem',
          }}>
            <div style={{ height: 3, background: 'var(--grad-brand)', marginBottom: '1.25rem', marginLeft: '-1.5rem', marginRight: '-1.5rem', marginTop: '-1.25rem' }} />
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="skeleton" style={{ width: 28, height: 14 }} />
              <div className="skeleton" style={{ width: 60, height: 14 }} />
            </div>
            <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 160, marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="skeleton" style={{ height: 12, width: '20%' }} />
              <div className="skeleton" style={{ height: 12, width: '15%' }} />
            </div>
          </div>
        )}

        {/* ── Result cards ──────────────────────────────────────────────── */}
        {results.length > 0 && (
          <div style={{
            maxWidth: 1100, margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 500px), 1fr))',
            gap: '1rem',
          }}>
            {results.map((r, i) => (
              <ResultCard key={r.id ?? i} result={r} index={r.id ?? (results.length - i)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom input bar ────────────────────────────────────────────── */}
      <InputBar
        onSubmit={submitQuestion}
        loading={loading}
        lastSQL={lastSQL}
        onClear={clearAll}
      />
    </div>
  );
}
