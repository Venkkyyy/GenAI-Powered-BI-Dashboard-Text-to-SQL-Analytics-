/**
 * components/ResultCard.jsx
 *
 * Antigravity-style BI Readout Card.
 * Clean white surface, gradient border highlight, KPI metrics row,
 * interactive chart engine, formatted SQL inspector, and feedback.
 */
import React, { useMemo, useState } from 'react';
import QueryChart from './QueryChart';
import { highlightSQL } from '../utils/sqlHighlight';

export default function ResultCard({ result, index }) {
  const [sqlOpen, setSqlOpen] = useState(false);
  const [vote, setVote]       = useState(null);
  const [copied, setCopied]   = useState(false);

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

  // Quick KPI calculation
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
      topItem: firstRow[keys[0]],
    };
  }, [result.data]);

  const hasData = result.data && result.data.length > 0;

  return (
    <div
      className="card-enter"
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 20,
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 200ms ease',
      }}
    >
      {/* Sleek Gradient Accent Line */}
      <div style={{
        height: 4,
        background: 'linear-gradient(90deg, #4f46e5 0%, #06b6d4 50%, #8b5cf6 100%)',
      }} />

      <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                fontWeight: 700,
                color: '#4f46e5',
                background: '#eef2ff',
                padding: '1px 6px',
                borderRadius: 4,
              }}>
                #{String(index).padStart(2, '0')}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{ts}</span>
              {result.executionMs != null && (
                <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>· {result.executionMs}ms</span>
              )}
              {result.provider && (
                <span style={{
                  fontSize: '0.65rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  borderRadius: 4,
                  padding: '1px 6px',
                }}>
                  {result.provider}
                </span>
              )}
            </div>

            <h3 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#0f172a',
              lineHeight: 1.35,
              marginTop: 2,
            }}>
              {result.question}
            </h3>
          </div>
        </div>

        {/* ── KPI Summary Strip (if numeric data present) ─────────────── */}
        {summaryKpi && hasData && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            background: '#f8fafc',
            border: '1px solid #f1f5f9',
            borderRadius: 12,
            padding: '0.65rem 1rem',
          }}>
            <div>
              <p style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em' }}>
                TOTAL {summaryKpi.label}
              </p>
              <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-heading)' }}>
                {summaryKpi.total}
              </p>
            </div>
            {summaryKpi.topItem && (
              <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '1.25rem' }}>
                <p style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em' }}>
                  TOP CONTRIBUTOR
                </p>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4f46e5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                  {summaryKpi.topItem}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Chart / Data View ───────────────────────────────────────── */}
        {result.error ? (
          <div style={{
            background: '#fff1f2',
            border: '1px solid #ffe4e6',
            borderRadius: 12,
            padding: '0.85rem 1rem',
            fontSize: '0.82rem',
            color: '#e11d48',
          }}>
            ⚠ {result.error}
          </div>
        ) : hasData ? (
          <div style={{
            background: '#ffffff',
            border: '1px solid #f1f5f9',
            borderRadius: 14,
            padding: '0.75rem',
          }}>
            <QueryChart
              chartType={result.chartType}
              data={result.data}
              columnMap={result.columnMap}
            />
          </div>
        ) : (
          <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
            No rows returned.
          </div>
        )}

        {/* ── SQL Inspector (Collapsible) ─────────────────────────────── */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 12px',
          }}>
            <button
              onClick={() => setSqlOpen(o => !o)}
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
              }}
            >
              <span>{sqlOpen ? '▾' : '▸'}</span>
              <span>SQL Query</span>
            </button>
            {sqlOpen && (
              <button
                onClick={copySQL}
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: copied ? '#10b981' : '#6366f1',
                  cursor: 'pointer',
                  padding: '2px 6px',
                }}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            )}
          </div>

          {sqlOpen && (
            <pre style={{
              padding: '0.75rem 1rem',
              margin: 0,
              background: '#09090b',
              color: '#f8fafc',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              lineHeight: 1.6,
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              borderTop: '1px solid #1e293b',
            }}>
              {highlightSQL(result.sql ?? '')}
            </pre>
          )}
        </div>

        {/* ── AI Explanation & Feedback ──────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          paddingTop: '0.25rem',
        }}>
          {result.explanation ? (
            <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5, flex: 1 }}>
              {result.explanation}
            </p>
          ) : <div />}

          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button
              onClick={() => submitFeedback('up')}
              title="Helpful"
              style={{
                width: 28, height: 28, borderRadius: 6,
                border: '1px solid #e2e8f0',
                background: vote === 'up' ? '#eef2ff' : '#ffffff',
                color: vote === 'up' ? '#4f46e5' : '#64748b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              👍
            </button>
            <button
              onClick={() => submitFeedback('down')}
              title="Not helpful"
              style={{
                width: 28, height: 28, borderRadius: 6,
                border: '1px solid #e2e8f0',
                background: vote === 'down' ? '#fff1f2' : '#ffffff',
                color: vote === 'down' ? '#e11d48' : '#64748b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              👎
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
