/**
 * App.jsx  v3 — Light theme with CSV upload support
 *
 * Modes:
 *  - No dataset: shows empty state with suggestion grid, queries run on Supabase DB
 *  - Dataset uploaded: input bar shows dataset badge, queries run on in-memory CSV
 */
import React, { useCallback, useRef, useState } from 'react';
import Sidebar    from './components/Sidebar';
import InputBar   from './components/InputBar';
import ResultCard from './components/ResultCard';

const DEMO_SUGGESTIONS = [
  { label: "Top 5 products by revenue",      icon: "🏆", q: "top 5 products by revenue" },
  { label: "Monthly revenue trend",          icon: "📈", q: "monthly revenue trend" },
  { label: "Orders by country",              icon: "🌍", q: "orders by country" },
  { label: "Customers by loyalty tier",      icon: "⭐", q: "customers by loyalty tier" },
  { label: "Average order value by category",icon: "💰", q: "average order value by product category" },
  { label: "Products low in stock",          icon: "📦", q: "products with lowest stock" },
];

export default function App() {
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [lastSQL,  setLastSQL]  = useState(null);
  const [error,    setError]    = useState(null);
  const [counter,  setCounter]  = useState(0);
  const [dataset,  setDataset]  = useState(null);   // uploaded CSV info
  const gridRef = useRef(null);

  /* ── Submit a question ──────────────────────────────────────────────────── */
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
      const entry = {
        ...json,
        id,
        askedAt: json.askedAt ?? new Date().toISOString(),
        dataSource: dataset ? 'dataset' : 'database',
      };
      setResults(prev => [entry, ...prev]);

      setTimeout(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    } catch {
      setError('Connection error — is the backend running on port 3001?');
    } finally {
      setLoading(false);
    }
  }, [loading, counter, dataset]);

  /* ── Upload CSV ─────────────────────────────────────────────────────────── */
  function handleUpload(uploadData) {
    setDataset(uploadData);
    setError(null);
    setResults([]);
    setLastSQL(null);
    setCounter(0);
  }

  /* ── Clear dataset ──────────────────────────────────────────────────────── */
  async function handleClearDataset() {
    try { await fetch('/api/upload', { method: 'DELETE' }); } catch {}
    setDataset(null);
    setResults([]);
    setLastSQL(null);
    setCounter(0);
  }

  /* ── New query ──────────────────────────────────────────────────────────── */
  function clearAll() {
    setResults([]);
    setLastSQL(null);
    setError(null);
    setCounter(0);
  }

  const isEmpty = results.length === 0 && !loading;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <Sidebar
        history={results.map(r => ({ id: r.id, question: r.question, askedAt: r.askedAt }))}
        dataset={dataset}
        onNew={clearAll}
        onSelect={submitQuestion}
        onUpload={handleUpload}
        onClearDataset={handleClearDataset}
      />

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="main-content" style={{
        marginLeft: 280, flex: 1,
        minHeight: '100vh',
        paddingBottom: 240,
        paddingTop: '2.5rem',
        paddingLeft: '2rem',
        paddingRight: '2rem',
      }}>

        {/* ── Empty state ────────────────────────────────────────────────── */}
        {isEmpty && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 260px)',
            gap: '2.5rem', textAlign: 'center',
          }}>
            {/* Logo + headline */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: '#202124',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 700,
                fontFamily: 'var(--font-mono)', color: '#FFB454',
                boxShadow: '0 4px 16px rgba(32,33,36,0.2)',
              }}>Q</div>

              <div>
                <h1 style={{
                  fontSize: '2.25rem', fontWeight: 700, color: 'var(--text-1)',
                  letterSpacing: '-0.02em', marginBottom: '0.4rem',
                }}>
                  {dataset
                    ? <>Exploring <span style={{ color: 'var(--amber)' }}>{dataset.tableName}</span></>
                    : 'What do you want to know?'
                  }
                </h1>
                <p style={{ fontSize: '1rem', color: 'var(--text-2)', maxWidth: 500 }}>
                  {dataset
                    ? `${dataset.rowCount.toLocaleString()} rows · ${dataset.columns.length} columns loaded. Ask anything about your data.`
                    : 'Upload a CSV or ask about the built-in e-commerce demo. Queryline generates SQL and charts the answer instantly.'
                  }
                </p>
              </div>
            </div>

            {/* Upload prompt (when no dataset) */}
            {!dataset && (
              <div style={{
                background: '#fff8e7', border: '1px solid #f9ab00', borderRadius: 12,
                padding: '0.85rem 1.5rem', maxWidth: 460,
                display: 'flex', alignItems: 'center', gap: '0.75rem',
              }}>
                <span style={{ fontSize: '1.2rem' }}>📂</span>
                <p style={{ fontSize: '0.82rem', color: '#8a5e00', textAlign: 'left', lineHeight: 1.5 }}>
                  <strong>Upload your own CSV</strong> from the sidebar to query any dataset — sales, inventory, analytics, anything.
                </p>
              </div>
            )}

            {/* Suggestion cards */}
            {!dataset && (
              <>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: -8 }}>Or try the demo data:</p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.65rem', width: '100%', maxWidth: 680,
                }}>
                  {DEMO_SUGGESTIONS.map(s => (
                    <button
                      key={s.label}
                      onClick={() => submitQuestion(s.q)}
                      style={{
                        textAlign: 'left', background: '#fff',
                        border: '1px solid var(--border)', borderRadius: 12,
                        padding: '0.8rem 1rem', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', gap: '0.3rem',
                        boxShadow: 'var(--shadow-xs)',
                        transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#f9ab00';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(60,64,67,0.14)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-1)', fontWeight: 500, lineHeight: 1.4 }}>{s.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Dataset column preview */}
            {dataset && (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 600,
              }}>
                {dataset.columns.slice(0, 12).map(col => (
                  <span key={col.name} style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
                    background: col.type === 'NUMBER' ? '#e8f0fe' : col.type === 'DATE' ? '#e6f4ea' : '#f1f3f4',
                    color: col.type === 'NUMBER' ? '#1a73e8' : col.type === 'DATE' ? '#1e8e3e' : '#5f6368',
                    borderRadius: 6, padding: '3px 9px', border: '1px solid',
                    borderColor: col.type === 'NUMBER' ? '#c5d9f7' : col.type === 'DATE' ? '#c6e8ce' : '#e0e0e0',
                  }}>
                    {col.name} <span style={{ opacity: 0.6 }}>{col.type}</span>
                  </span>
                ))}
                {dataset.columns.length > 12 && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)', padding: '3px 0' }}>
                    +{dataset.columns.length - 12} more
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Error toast ─────────────────────────────────────────────────── */}
        {error && (
          <div role="alert" className="fade-in" style={{
            maxWidth: 760, margin: '0 auto 1rem',
            padding: '0.75rem 1rem',
            background: '#fce8e6', border: '1px solid #f5c6c2',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
            fontSize: '0.82rem', color: '#d93025',
          }}>
            <span>⚠ {error}</span>
            <button onClick={() => setError(null)}
              style={{ background: 'none', border: 'none', color: '#d93025', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>✕</button>
          </div>
        )}

        {/* ── Loading skeleton ─────────────────────────────────────────────── */}
        {loading && (
          <div ref={gridRef} style={{
            maxWidth: 760, margin: '0 auto 1rem',
            background: '#fff', border: '1px solid var(--border)',
            borderRadius: 20, overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
            padding: '1rem 1.25rem',
          }}>
            <div style={{ height: 3, background: '#f1f3f4', marginBottom: '1rem', marginLeft: '-1.25rem', marginRight: '-1.25rem', marginTop: '-1rem' }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div className="skeleton" style={{ width: 28, height: 12 }} />
              <div className="skeleton" style={{ width: 60, height: 12 }} />
            </div>
            <div className="skeleton" style={{ height: 16, width: '65%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 180, marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="skeleton" style={{ height: 10, width: '18%' }} />
              <div className="skeleton" style={{ height: 10, width: '12%' }} />
            </div>
          </div>
        )}

        {/* ── Result cards ─────────────────────────────────────────────────── */}
        {results.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 520px), 1fr))',
            gap: '1rem',
            maxWidth: 1120, margin: '0 auto',
          }}>
            {results.map((r, i) => (
              <ResultCard key={r.id ?? i} result={r} index={r.id ?? (results.length - i)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom input bar ────────────────────────────────────────────────── */}
      <InputBar
        onSubmit={submitQuestion}
        loading={loading}
        lastSQL={lastSQL}
        dataset={dataset}
      />
    </div>
  );
}
