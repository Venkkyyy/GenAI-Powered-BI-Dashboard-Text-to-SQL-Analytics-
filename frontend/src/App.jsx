/**
 * App.jsx
 *
 * Queryline — Antigravity BI Dashboard.
 * Includes Antigravity top navigation, dynamic particle background,
 * hero welcome state, drag-and-drop CSV integration, and interactive chart readout cards.
 */
import React, { useCallback, useRef, useState } from 'react';
import Sidebar from './components/Sidebar';
import InputBar from './components/InputBar';
import ResultCard from './components/ResultCard';

const DEMO_SUGGESTIONS = [
  { label: "Top 5 products by revenue", icon: "🏆", q: "top 5 products by revenue", tag: "Revenue" },
  { label: "Monthly revenue trend", icon: "📈", q: "monthly revenue trend", tag: "Trend" },
  { label: "Orders distribution by country", icon: "🌍", q: "orders by country", tag: "Geographic" },
  { label: "Customers by loyalty tier", icon: "⭐", q: "customers by loyalty tier", tag: "Segmentation" },
  { label: "Average order value by category", icon: "💰", q: "average order value by product category", tag: "Metrics" },
  { label: "Products low in stock inventory", icon: "📦", q: "products with lowest stock", tag: "Inventory" },
];

export default function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastSQL, setLastSQL] = useState(null);
  const [error, setError] = useState(null);
  const [counter, setCounter] = useState(0);
  const [dataset, setDataset] = useState(null);
  const bottomRef = useRef(null);

  /* ── Submit question ────────────────────────────────────────────────────── */
  const submitQuestion = useCallback(async (question) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setLastSQL(null);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.reason ?? json.error ?? "Could not run query safely. Try rephrasing.");
        setLoading(false);
        return;
      }

      setLastSQL(json.sql);
      const id = counter + 1;
      setCounter(id);
      const entry = {
        ...json,
        id,
        askedAt: json.askedAt ?? new Date().toISOString(),
        dataSource: dataset ? 'dataset' : 'database',
      };
      setResults(prev => [...prev, entry]);

      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 120);
    } catch {
      setError('Connection error — is the backend server running on port 3001?');
    } finally {
      setLoading(false);
    }
  }, [loading, counter, dataset]);

  function handleUpload(uploadData) {
    setDataset(uploadData);
    setError(null);
    setResults([]);
    setLastSQL(null);
    setCounter(0);
  }

  async function handleClearDataset() {
    try { await fetch('/api/upload', { method: 'DELETE' }); } catch {}
    setDataset(null);
    setResults([]);
    setLastSQL(null);
    setCounter(0);
  }

  function clearAll() {
    setResults([]);
    setLastSQL(null);
    setError(null);
    setCounter(0);
  }

  const isEmpty = results.length === 0 && !loading;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-canvas)' }}>
      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <Sidebar
        history={results.map(r => ({ id: r.id, question: r.question, askedAt: r.askedAt }))}
        dataset={dataset}
        onNew={clearAll}
        onSelect={submitQuestion}
        onUpload={handleUpload}
        onClearDataset={handleClearDataset}
      />

      {/* ── Main Canvas ────────────────────────────────────────────────────── */}
      <div
        className="main-content"
        style={{
          marginLeft: 280,
          flex: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* ── Queryline Top Bar ────────────────────────────────────────────── */}
        <header
          style={{
            height: 60,
            borderBottom: '1px solid #f1f5f9',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
        >
          {/* Active Data Source Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: dataset ? '#eff6ff' : '#f0fdf4',
                border: `1px solid ${dataset ? '#bfdbfe' : '#bbf7d0'}`,
                color: dataset ? '#1d4ed8' : '#15803d',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: 999,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: dataset ? '#2563eb' : '#16a34a', display: 'inline-block' }} />
                {dataset ? `Custom File: ${dataset.tableName}` : 'Supabase PostgreSQL (Live)'}
              </span>
            </div>

            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              {dataset ? `${dataset.rowCount.toLocaleString()} rows · ${dataset.columns.length} columns` : '4 tables introspected · AST Guard active'}
            </span>
          </div>

          {/* Right Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn-antigravity"
              style={{ padding: '0.45rem 1.1rem', fontSize: '0.78rem' }}
              onClick={() => submitQuestion('top 5 products by revenue')}
            >
              <span>⚡ Run Sample Query</span>
            </button>
          </div>
        </header>

        {/* ── Content Container ────────────────────────────────────────────── */}
        <main
          style={{
            flex: 1,
            padding: '2.5rem 2rem 240px',
            maxWidth: 1200,
            width: '100%',
            margin: '0 auto',
          }}
        >
          {/* ── Hero Welcome Screen (when empty) ─────────────────────────── */}
          {isEmpty && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '3rem 1rem 1rem',
                gap: '2rem',
              }}
            >
              {/* Product Feature Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '0.4rem 1rem',
                borderRadius: 9999,
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#475569',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}>
                <span style={{ color: '#4f46e5' }}>✦</span>
                <span>GenAI-Powered Text-to-SQL Business Intelligence</span>
              </div>

              {/* Hero Heading */}
              <div style={{ maxWidth: 780 }}>
                <h1
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '3rem',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.15,
                    color: '#09090b',
                    marginBottom: '1rem',
                  }}
                >
                  Turn plain questions into live analytics
                </h1>
                <p
                  style={{
                    fontSize: '1.08rem',
                    color: '#475569',
                    lineHeight: 1.6,
                    maxWidth: 620,
                    margin: '0 auto',
                  }}
                >
                  {dataset
                    ? `Dataset "${dataset.tableName}" is loaded and ready. Ask any business question to generate SQL and visual readouts instantly.`
                    : 'Ask plain-English business questions. Queryline generates AST-validated SQL against your live database schema and charts the answers instantly.'
                  }
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  className="btn-antigravity"
                  onClick={() => submitQuestion('top 5 products by revenue')}
                >
                  <span>📊 Explore Live Analytics</span>
                </button>
                <button
                  className="btn-ghost-pill"
                  style={{ padding: '0.65rem 1.3rem', fontSize: '0.875rem', fontWeight: 600 }}
                  onClick={() => submitQuestion('monthly revenue trend')}
                >
                  <span>📈 Monthly Revenue Trend</span>
                </button>
              </div>

              {/* Suggestion Cards Grid */}
              <div style={{ marginTop: '1.5rem', width: '100%', maxWidth: 880 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                  Recommended Questions
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '0.85rem',
                  }}
                >
                  {DEMO_SUGGESTIONS.map(s => (
                    <button
                      key={s.label}
                      onClick={() => submitQuestion(s.q)}
                      style={{
                        textAlign: 'left',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 16,
                        padding: '1rem 1.15rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#4f46e5';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 24px -6px rgba(79, 70, 229, 0.12)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.25rem' }}>{s.icon}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#4f46e5', background: '#eef2ff', padding: '2px 8px', borderRadius: 999 }}>
                          {s.tag}
                        </span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.4 }}>
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Error Banner ─────────────────────────────────────────────── */}
          {error && (
            <div
              className="card-enter"
              style={{
                maxWidth: 840,
                margin: '0 auto 1.5rem',
                padding: '0.85rem 1.25rem',
                background: '#fff1f2',
                border: '1px solid #ffe4e6',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                fontSize: '0.85rem',
                color: '#e11d48',
                fontWeight: 500,
              }}
            >
              <span>⚠ {error}</span>
              <button
                onClick={() => setError(null)}
                style={{ background: 'none', border: 'none', color: '#e11d48', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* ── Result Cards Feed (Chronological: Older on top, Newer below) ── */}
          {results.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                maxWidth: 960,
                margin: '0 auto',
                width: '100%',
              }}
            >
              {results.map((r, i) => (
                <ResultCard key={r.id ?? i} result={r} index={i + 1} />
              ))}
            </div>
          )}

          {/* ── Loading Skeleton (Appears at the bottom under previous tasks) ── */}
          {loading && (
            <div
              className="card-enter"
              style={{
                maxWidth: 960,
                margin: '1.5rem auto 0',
                width: '100%',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 18,
                boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.05)',
                padding: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 32, height: 16, background: '#f1f5f9', borderRadius: 4 }} />
                <div style={{ width: 120, height: 16, background: '#f1f5f9', borderRadius: 4 }} />
              </div>
              <div style={{ width: '70%', height: 24, background: '#f1f5f9', borderRadius: 6, marginBottom: 20 }} />
              <div style={{ width: '100%', height: 140, background: '#09090b', borderRadius: 12, marginBottom: 16 }} />
              <div style={{ width: '100%', height: 220, background: '#f8fafc', borderRadius: 12 }} />
            </div>
          )}

          {/* Bottom scroll target anchor */}
          <div ref={bottomRef} style={{ height: 1 }} />
        </main>

        {/* ── Floating Console Bar ──────────────────────────────────────── */}
        <InputBar
          onSubmit={submitQuestion}
          loading={loading}
          lastSQL={lastSQL}
          dataset={dataset}
        />
      </div>
    </div>
  );
}
