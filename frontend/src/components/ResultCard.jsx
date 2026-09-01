/**
 * components/ResultCard.jsx  v2
 * Gemini-style answer card: glassmorphism, gradient top border,
 * chart, collapsible SQL with syntax highlight, and feedback.
 */
import React, { useState } from 'react';
import QueryChart from './QueryChart';
import { highlightSQL } from '../utils/sqlHighlight';

const CHART_TYPE_ICONS = {
  bar: '▦', time_series: '╱╱', pie: '◕', scatter: '⋯', table: '⊞',
};

export default function ResultCard({ result, index }) {
  const [sqlOpen, setSqlOpen] = useState(false);
  const [vote, setVote]       = useState(null);
  const [copied, setCopied]   = useState(false);

  const ts = new Date(result.askedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  async function submitFeedback(v) {
    if (vote) return;
    setVote(v);
    try {
      await fetch('/api/feedback', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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

  const chartIcon = CHART_TYPE_ICONS[result.chartType] ?? '⊞';
  const hasData = result.data && result.data.length > 0;

  return (
    <div className="card-enter" style={{
      background: 'var(--glass)',
      backdropFilter: 'blur(12px)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-xl)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-md)',
      transition: 'box-shadow var(--t-mid)',
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
    >
      {/* Gradient top bar */}
      <div style={{
        height: 3,
        background: 'linear-gradient(90deg, var(--amber), #ff8c00 40%, #c58af9 100%)',
      }} />

      <div style={{ padding: '1.25rem 1.5rem' }}>
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Index + timestamp */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                color: 'var(--amber)', fontWeight: 600,
              }}>#{String(index).padStart(2, '0')}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-3)' }}>{ts}</span>
              {result.executionMs != null && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-3)' }}>
                  · {result.executionMs}ms
                </span>
              )}
            </div>
            {/* Question */}
            <p style={{
              fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-1)',
              lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {result.question}
            </p>
          </div>

          {/* Chips */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
              color: 'var(--text-2)', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
              padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              {chartIcon} {result.chartType ?? 'table'}
            </span>
            {result.provider && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                color: 'var(--text-3)',
              }}>via {result.provider}</span>
            )}
          </div>
        </div>

        {/* ── Chart / Error ──────────────────────────────────────────── */}
        {result.error ? (
          <div style={{
            background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.2)',
            borderRadius: 'var(--r-md)', padding: '0.75rem 1rem',
            fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#ff6b6b',
          }}>
            ⚠ {result.error}
          </div>
        ) : hasData ? (
          <div style={{ borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
            <QueryChart chartType={result.chartType} data={result.data} columnMap={result.columnMap} />
          </div>
        ) : (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-3)', padding: '0.5rem 0' }}>
            No rows returned.
          </p>
        )}

        {/* ── Stats row ─────────────────────────────────────────────── */}
        {result.rowCount != null && (
          <div style={{
            display: 'flex', gap: '0.75rem', marginTop: '0.75rem',
            fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-3)',
          }}>
            <span>{result.rowCount} row{result.rowCount !== 1 ? 's' : ''}</span>
            {result.warnings?.length > 0 && (
              <span style={{ color: 'var(--amber)' }}>⚠ {result.warnings[0]}</span>
            )}
          </div>
        )}

        {/* ── SQL panel ────────────────────────────────────────────────── */}
        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button className="btn-ghost" onClick={() => setSqlOpen(o => !o)} aria-expanded={sqlOpen}>
              {sqlOpen ? '▾ Hide SQL' : '▸ View SQL'}
            </button>
            {sqlOpen && (
              <button className="btn-ghost" onClick={copySQL}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            )}
          </div>

          {sqlOpen && (
            <pre className="fade-in" style={{
              marginTop: '0.5rem',
              padding: '0.85rem',
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              lineHeight: 1.75,
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              color: 'var(--text-2)',
            }}>
              {highlightSQL(result.sql ?? '')}
            </pre>
          )}
        </div>

        {/* ── Explanation + feedback ──────────────────────────────────── */}
        {(result.explanation || true) && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            gap: '0.75rem', marginTop: '0.75rem',
          }}>
            {result.explanation && (
              <p style={{
                fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.5, flex: 1,
              }}>
                {result.explanation}
              </p>
            )}

            <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
              <button
                className="btn-icon"
                aria-label="Helpful"
                onClick={() => submitFeedback('up')}
                style={{ opacity: vote === 'down' ? 0.3 : vote === 'up' ? 1 : 0.5 }}
                title="Helpful"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill={vote === 'up' ? 'var(--amber)' : 'none'} stroke={vote === 'up' ? 'var(--amber)' : 'var(--text-2)'} strokeWidth="2">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                  <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                </svg>
              </button>
              <button
                className="btn-icon"
                aria-label="Not helpful"
                onClick={() => submitFeedback('down')}
                style={{ opacity: vote === 'up' ? 0.3 : vote === 'down' ? 1 : 0.5 }}
                title="Not helpful"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill={vote === 'down' ? '#f87171' : 'none'} stroke={vote === 'down' ? '#f87171' : 'var(--text-2)'} strokeWidth="2">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                  <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
