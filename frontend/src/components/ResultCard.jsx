/**
 * components/ResultCard.jsx
 *
 * Core BI Solution Card:
 * 1. User Natural Language Question
 * 2. MAIN TARGET: AI Generated SQL (Line-by-Line Formatted with Line Numbers & IDE theme)
 * 3. Live Interactive Recharts Visualization (Bar / Trend / Donut / Table)
 * 4. Summary Metrics, AI Explanation & Feedback
 */
import React, { useMemo, useState } from 'react';
import QueryChart from './QueryChart';
import { FormattedSQLViewer } from '../utils/sqlHighlight';

export default function ResultCard({ result, index }) {
  const [copied, setCopied] = useState(false);
  const [vote, setVote]     = useState(null);

  const ts = new Date(result.askedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  async function submitFeedback(v) {
    if (vote) return;
    setVote(v);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: result.id, vote: v }),
      });
    } catch {}
  }

  async function copySQL() {
    try {
      await navigator.clipboard.writeText(result.sql ?? '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  function exportCSV() {
    if (!result.data || result.data.length === 0) return;
    const cols = Object.keys(result.data[0]);
    const csvRows = [
      cols.join(','),
      ...result.data.map(row => cols.map(c => JSON.stringify(row[c] ?? '')).join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `queryline_results_${result.id || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Calculate Quick Metric Summary
  const summaryKpi = useMemo(() => {
    if (!result.data || result.data.length === 0) return null;
    const firstRow = result.data[0];
    const keys = Object.keys(firstRow);
    const numKey = keys.find(k => !isNaN(Number(firstRow[k])) && typeof firstRow[k] !== 'boolean');
    if (!numKey) return null;

    const sum = result.data.reduce((acc, r) => acc + (Number(r[numKey]) || 0), 0);
    return {
      label: numKey.replace(/_/g, ' ').toUpperCase(),
      total: sum >= 1000 ? `$${sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : sum.toLocaleString(),
      count: result.data.length,
    };
  }, [result.data]);

  const hasData = result.data && result.data.length > 0;

  return (
    <div
      className="card-enter"
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 18,
        boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.07), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '1.5rem',
      }}
    >
      {/* ── Top Color Accent Strip ─────────────────────────────────────── */}
      <div style={{
        height: 4,
        background: 'linear-gradient(90deg, #4f46e5 0%, #06b6d4 50%, #10b981 100%)',
      }} />

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── 1. USER QUESTION HEADER ──────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 6 }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                fontWeight: 700,
                color: '#4f46e5',
                background: '#eef2ff',
                padding: '2px 8px',
                borderRadius: 999,
              }}>
                Query #{String(index).padStart(2, '0')}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{ts}</span>
              {result.executionMs != null && (
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>· {result.executionMs}ms execution</span>
              )}
              {result.provider && (
                <span style={{
                  fontSize: '0.65rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#475569',
                  borderRadius: 4,
                  padding: '1px 6px',
                  fontWeight: 500,
                }}>
                  {result.provider}
                </span>
              )}
            </div>

            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.2rem',
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.35,
            }}>
              {result.question}
            </h2>
          </div>
        </div>

        {/* ── 2. PRIMARY TARGET: AI GENERATED SQL TERMINAL ─────────────── */}
        <div style={{
          background: '#09090b',
          borderRadius: 14,
          border: '1px solid #1e293b',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
        }}>
          {/* Terminal Header Bar */}
          <div style={{
            background: '#18181b',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #27272a',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ display: 'flex', gap: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              </div>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#e2e8f0',
                letterSpacing: '0.02em',
              }}>
                Generated SQL (AST Validated)
              </span>
            </div>

            <button
              onClick={copySQL}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: copied ? '#10b981' : '#27272a',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'Copied' : 'Copy SQL'}</span>
            </button>
          </div>

          {/* Formatted Line-by-Line Code Area */}
          <div style={{ padding: '1rem 1.25rem' }}>
            <FormattedSQLViewer sql={result.sql} />
          </div>
        </div>

        {/* ── 3. AI EXPLANATION & KEY FINDINGS ─────────────────────────── */}
        {result.explanation && (
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderLeft: '3px solid #4f46e5',
            borderRadius: 8,
            padding: '0.75rem 1rem',
            fontSize: '0.82rem',
            color: '#334155',
            lineHeight: 1.5,
          }}>
            <strong style={{ color: '#0f172a' }}>AI Insight: </strong>
            {result.explanation}
          </div>
        )}

        {/* ── 4. LIVE INTERACTIVE CHART & DATA VISUALIZATION ───────────── */}
        {result.error ? (
          <div style={{
            background: '#fff1f2',
            border: '1px solid #ffe4e6',
            borderRadius: 12,
            padding: '1rem',
            fontSize: '0.85rem',
            color: '#e11d48',
            fontWeight: 500,
          }}>
            ⚠ {result.error}
          </div>
        ) : hasData ? (
          <div style={{
            background: '#ffffff',
            border: '1px solid #f1f5f9',
            borderRadius: 14,
            padding: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.85rem' }}>📊</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                  Visual Analytics
                </span>
              </div>
              {summaryKpi && (
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
                  Total {summaryKpi.label}: <strong style={{ color: '#0f172a' }}>{summaryKpi.total}</strong>
                </span>
              )}
            </div>

            <QueryChart
              chartType={result.chartType}
              data={result.data}
              columnMap={result.columnMap}
            />
          </div>
        ) : (
          <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
            Query executed successfully. 0 rows matched your criteria.
          </div>
        )}

        {/* ── 5. FOOTER: FEEDBACK & DETAILS ────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '0.75rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
              {result.rowCount ?? (result.data?.length || 0)} records returned
            </span>

            {hasData && (
              <button
                onClick={exportCSV}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  padding: '2px 8px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'all 120ms ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.color = '#4f46e5'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#475569'; }}
                title="Download query results as CSV"
              >
                <span>📥 Export CSV</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Accurate SQL?</span>
            <button
              onClick={() => submitFeedback('up')}
              title="Yes, accurate SQL"
              style={{
                padding: '3px 8px',
                borderRadius: 6,
                border: '1px solid #e2e8f0',
                background: vote === 'up' ? '#eef2ff' : '#ffffff',
                color: vote === 'up' ? '#4f46e5' : '#64748b',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              👍 Yes
            </button>
            <button
              onClick={() => submitFeedback('down')}
              title="No, incorrect"
              style={{
                padding: '3px 8px',
                borderRadius: 6,
                border: '1px solid #e2e8f0',
                background: vote === 'down' ? '#fff1f2' : '#ffffff',
                color: vote === 'down' ? '#e11d48' : '#64748b',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              👎 No
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
