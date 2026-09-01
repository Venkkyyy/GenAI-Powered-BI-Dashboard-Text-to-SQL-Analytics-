/**
 * components/ResultCard.jsx  v3 — Light theme
 * White card with subtle shadow, colored chart border, clean typography
 */
import React, { useState } from 'react';
import QueryChart from './QueryChart';
import { highlightSQL } from '../utils/sqlHighlight';

const CHART_ICONS = { bar: '▦', time_series: '╱', pie: '◕', scatter: '·', table: '⊞' };

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
    try { await navigator.clipboard.writeText(result.sql ?? ''); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  }

  const hasData = result.data && result.data.length > 0;

  return (
    <div className="card-enter" style={{
      background: '#ffffff',
      border: '1px solid #e0e0e0',
      borderRadius: 20,
      boxShadow: '0 1px 6px rgba(60,64,67,0.12)',
      overflow: 'hidden',
      transition: 'box-shadow 220ms cubic-bezier(0.4,0,0.2,1)',
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(60,64,67,0.14)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 6px rgba(60,64,67,0.12)'}
    >
      {/* Colored top border — amber for bar, blue for line, purple for pie */}
      <div style={{
        height: 3,
        background: result.chartType === 'time_series' ? '#1a73e8'
                  : result.chartType === 'pie'         ? '#7c4dff'
                  : result.chartType === 'scatter'     ? '#1e8e3e'
                  : '#f29900',
      }} />

      <div style={{ padding: '1rem 1.25rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.85rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--amber)', fontWeight: 700 }}>
                #{String(index).padStart(2, '0')}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-3)' }}>{ts}</span>
              {result.executionMs != null && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-3)' }}>· {result.executionMs}ms</span>
              )}
              {result.dataSource === 'dataset' && (
                <span style={{ fontSize: '0.6rem', background: '#fff8e7', border: '1px solid #f9ab00', borderRadius: 4, padding: '0 5px', color: '#b06000' }}>
                  📄 CSV
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-1)', lineHeight: 1.4 }}>
              {result.question}
            </p>
          </div>

          {/* Chart type chip */}
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 500,
            background: 'var(--bg-2)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '3px 8px', color: 'var(--text-2)',
            alignSelf: 'flex-start', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {CHART_ICONS[result.chartType] ?? '⊞'} {result.chartType ?? 'table'}
          </span>
        </div>

        {/* Chart / Error */}
        {result.error ? (
          <div style={{
            background: '#fce8e6', border: '1px solid #f5c6c2', borderRadius: 8,
            padding: '0.65rem 0.85rem', fontSize: '0.8rem', color: '#d93025',
          }}>⚠ {result.error}</div>
        ) : hasData ? (
          <QueryChart chartType={result.chartType} data={result.data} columnMap={result.columnMap} />
        ) : (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-3)' }}>No rows returned.</p>
        )}

        {/* Stats */}
        {result.rowCount != null && (
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-3)' }}>
            <span>{result.rowCount.toLocaleString()} rows</span>
            {result.warnings?.length > 0 && <span style={{ color: 'var(--amber)' }}>⚠ {result.warnings[0]}</span>}
          </div>
        )}

        {/* SQL panel */}
        <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn-ghost" onClick={() => setSqlOpen(o => !o)}>
              {sqlOpen ? '▾ Hide SQL' : '▸ View SQL'}
            </button>
            {sqlOpen && (
              <button className="btn-ghost" onClick={copySQL} style={{ color: copied ? 'var(--green)' : 'var(--text-2)' }}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            )}
          </div>
          {sqlOpen && (
            <pre className="fade-in" style={{
              marginTop: '0.5rem', padding: '0.75rem',
              background: '#f8f9fa', border: '1px solid var(--border)',
              borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
              lineHeight: 1.8, overflowX: 'auto', whiteSpace: 'pre-wrap',
              wordBreak: 'break-all', color: 'var(--text-2)',
            }}>
              {highlightSQL(result.sql ?? '')}
            </pre>
          )}
        </div>

        {/* Explanation + feedback */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '0.5rem', marginTop: '0.6rem' }}>
          {result.explanation && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', lineHeight: 1.5, flex: 1 }}>
              {result.explanation}
            </p>
          )}
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            <button className="btn-icon" title="Helpful" onClick={() => submitFeedback('up')}
              style={{ opacity: vote === 'down' ? 0.25 : vote === 'up' ? 1 : 0.5 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={vote==='up' ? '#1e8e3e' : 'none'} stroke={vote==='up' ? '#1e8e3e' : '#5f6368'} strokeWidth="2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
              </svg>
            </button>
            <button className="btn-icon" title="Not helpful" onClick={() => submitFeedback('down')}
              style={{ opacity: vote === 'up' ? 0.25 : vote === 'down' ? 1 : 0.5 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={vote==='down' ? '#d93025' : 'none'} stroke={vote==='down' ? '#d93025' : '#5f6368'} strokeWidth="2">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
