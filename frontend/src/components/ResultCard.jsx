/**
 * components/ResultCard.jsx
 * A single instrument-panel "readout" card for one query result.
 * Shows: index, timestamp, chart, collapsible SQL panel, explanation,
 * thumbs-up/down feedback, and an "Explain this" link.
 */
import React, { useState } from 'react';
import QueryChart from './QueryChart';
import { highlightSQL } from '../utils/sqlHighlight';

const CARD = {
  background: 'var(--surface)',
  border: '1px solid var(--border-hairline)',
  borderTop: '2px solid var(--accent-amber)',
  borderRadius: 'var(--radius-md)',
  padding: '1.25rem',
  boxShadow: 'var(--shadow-card)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const MONO_SM = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.72rem',
  color: 'var(--text-muted)',
};

const CHIP = {
  display: 'inline-block',
  background: 'var(--surface-raised)',
  border: '1px solid var(--border-hairline)',
  borderRadius: 'var(--radius-sm)',
  padding: '1px 7px',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.68rem',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

export default function ResultCard({ result, index }) {
  const [sqlOpen, setSqlOpen] = useState(false);
  const [vote, setVote]       = useState(null); // 'up' | 'down' | null

  const ts = new Date(result.askedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  async function submitFeedback(v) {
    setVote(v);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: result.id, vote: v }),
      });
    } catch { /* non-critical */ }
  }

  return (
    <div style={CARD} className="card-reveal">
      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ ...MONO_SM, color: 'var(--accent-amber)', marginRight: 8 }}>
            #{String(index).padStart(2, '0')}
          </span>
          <span style={{ ...MONO_SM }}>
            {ts}
          </span>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.9rem',
            color: 'var(--text-primary)',
            marginTop: '0.35rem',
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }} title={result.question}>
            {result.question}
          </p>
        </div>

        {/* Meta chips */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <span style={CHIP}>{result.chartType ?? 'table'}</span>
          {result.provider && <span style={{ ...CHIP, color: '#5EA8FF55', borderColor: 'transparent' }}>{result.provider}</span>}
        </div>
      </div>

      {/* ── Chart / table ──────────────────────────────────────────────── */}
      {result.data && result.data.length > 0
        ? <QueryChart chartType={result.chartType} data={result.data} columnMap={result.columnMap} />
        : (
          <p style={{ ...MONO_SM, padding: '0.5rem 0' }}>
            {result.error
              ? <span style={{ color: 'var(--error)' }}>⚠ {result.error}</span>
              : 'No rows returned.'}
          </p>
        )
      }

      {/* ── Stats row ──────────────────────────────────────────────────── */}
      {result.rowCount != null && (
        <div style={{ display: 'flex', gap: '1rem', ...MONO_SM }}>
          <span>{result.rowCount} row{result.rowCount !== 1 ? 's' : ''}</span>
          {result.executionMs != null && <span>{result.executionMs}ms</span>}
          {result.warnings?.length > 0 && (
            <span style={{ color: 'var(--accent-amber)' }}>⚠ {result.warnings.length} warning{result.warnings.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      )}

      {/* ── SQL panel (collapsible) ─────────────────────────────────────── */}
      <div>
        <button
          className="btn-ghost"
          onClick={() => setSqlOpen(o => !o)}
          aria-expanded={sqlOpen}
          style={{ marginLeft: -4 }}
        >
          {sqlOpen ? '▾ Hide SQL' : '▸ View SQL'}
        </button>

        {sqlOpen && (
          <pre style={{
            marginTop: '0.5rem',
            padding: '0.75rem',
            background: 'var(--bg-deep)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            lineHeight: 1.7,
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>
            {highlightSQL(result.sql ?? '')}
          </pre>
        )}
      </div>

      {/* ── Explanation + feedback ─────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        {result.explanation && (
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            flex: 1,
            minWidth: 0,
            lineHeight: 1.5,
          }}>
            {result.explanation}
          </p>
        )}

        {/* Thumbs feedback */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            className="btn-ghost"
            aria-label="Helpful"
            onClick={() => submitFeedback('up')}
            style={{ fontSize: '1rem', opacity: vote === null ? 0.5 : vote === 'up' ? 1 : 0.2 }}
          >👍</button>
          <button
            className="btn-ghost"
            aria-label="Not helpful"
            onClick={() => submitFeedback('down')}
            style={{ fontSize: '1rem', opacity: vote === null ? 0.5 : vote === 'down' ? 1 : 0.2 }}
          >👎</button>
        </div>
      </div>
    </div>
  );
}
