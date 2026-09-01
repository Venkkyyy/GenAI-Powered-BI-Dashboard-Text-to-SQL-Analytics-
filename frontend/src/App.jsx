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
  const gridRef = useRef(null);

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
      setResults(prev => [entry, ...prev]);

      setTimeout(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
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
        {/* ── Antigravity Top Nav Bar ──────────────────────────────────────── */}
        <header
          style={{
            height: 60,
            borderBottom: '1px solid #f1f5f9',
            background: 'rgba(255, 255, 255, 0.85)',
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
          {/* Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                <path d="M16 4L4 26H28L16 4Z" fill="#4f46e5" />
                <path d="M16 12L9 25H23L16 12Z" fill="#06b6d4" />
              </svg>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '0.9rem', color: '#09090b' }}>
                Google Antigravity
              </span>
            </div>

            <nav style={{ display: 'flex', gap: '1.25rem', fontSize: '0.82rem', fontWeight: 500, color: '#475569' }}>
              <span style={{ cursor: 'pointer' }}>Products ▾</span>
              <span style={{ cursor: 'pointer' }}>Use Cases ▾</span>
              <span style={{ cursor: 'pointer' }}>Pricing</span>
              <span style={{ cursor: 'pointer' }}>Enterprise</span>
            </nav>
          </div>

          {/* Right Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Live DB Connected
            </span>
            <button
              className="btn-antigravity"
              style={{ padding: '0.45rem 1.1rem', fontSize: '0.78rem' }}
              onClick={() => submitQuestion('top 5 products by revenue')}
            >
              <span>🚀 Quick Demo</span>
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
                gap: '2.25rem',
              }}
            >
              {/* Central Antigravity Badge */}
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
                <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                  <path d="M16 4L4 26H28L16 4Z" fill="#4f46e5" />
                  <path d="M16 12L9 25H23L16 12Z" fill="#06b6d4" />
                </svg>
                <span>Google Antigravity · Next-Gen Agentic BI Platform</span>
              </div>

              {/* Massive Hero Heading */}
              <div style={{ maxWidth: 780 }}>
                <h1
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '3.25rem',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.1,
                    color: '#09090b',
                    marginBottom: '1rem',
                  }}
                >
                  Experience liftoff with your business data
                </h1>
                <p
                  style={{
                    fontSize: '1.1rem',
                    color: '#475569',
                    lineHeight: 1.6,
                    maxWidth: 640,
                    margin: '0 auto',
                  }}
                >
                  {dataset
                    ? `Ready to explore ${dataset.tableName}. Ask any business question to generate SQL and visual readouts instantly.`
                    : 'Turn natural-language questions into live charts. Grounded by database schema introspection and guarded by AST validation.'
                  }
                </p>
              </div>

              {/* Hero Call to Action Buttons */}
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

          {/* ── Loading Skeleton ─────────────────────────────────────────── */}
          {loading && (
            <div
              ref={gridRef}
              style={{
                maxWidth: 840,
                margin: '0 auto 1.5rem',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 20,
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                padding: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 32, height: 16, background: '#f1f5f9', borderRadius: 4 }} />
                <div style={{ width: 80, height: 16, background: '#f1f5f9', borderRadius: 4 }} />
              </div>
              <div style={{ width: '60%', height: 22, background: '#f1f5f9', borderRadius: 6, marginBottom: 20 }} />
              <div style={{ width: '100%', height: 220, background: '#f8fafc', borderRadius: 12, marginBottom: 16 }} />
            </div>
          )}

          {/* ── Result Cards Grid ────────────────────────────────────────── */}
          {results.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 540px), 1fr))',
                gap: '1.25rem',
                maxWidth: 1140,
                margin: '0 auto',
              }}
            >
              {results.map((r, i) => (
                <ResultCard key={r.id ?? i} result={r} index={r.id ?? (results.length - i)} />
              ))}
            </div>
          )}
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
