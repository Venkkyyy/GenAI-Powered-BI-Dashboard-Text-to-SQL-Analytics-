/**
 * components/HistoryRail.jsx
 * Collapsible left rail showing session query history.
 * Mono timestamps + truncated questions — click to re-run.
 */
import React, { useState } from 'react';

const RAIL_OPEN  = { width: 220, flexShrink: 0 };
const RAIL_CLOSE = { width: 36, flexShrink: 0 };

const RAIL_INNER = {
  background: 'var(--surface)',
  border: '1px solid var(--border-hairline)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
  height: '100%',
  minHeight: 120,
};

const TOGGLE_BTN = {
  width: '100%',
  padding: '0.6rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderBottom: '1px solid var(--border-hairline)',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
};

export default function HistoryRail({ history, onSelect }) {
  const [open, setOpen] = useState(true);

  return (
    <aside style={open ? RAIL_OPEN : RAIL_CLOSE} aria-label="Query history">
      <div style={RAIL_INNER}>
        {/* Toggle button */}
        <button style={TOGGLE_BTN} onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Collapse history' : 'Expand history'}
          title={open ? 'Collapse' : 'Expand history'}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
            {open ? '◀ hist' : '▶'}
          </span>
        </button>

        {open && (
          <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 160px)', padding: '0.5rem 0' }}>
            {history.length === 0 && (
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                padding: '0.75rem 0.75rem',
                lineHeight: 1.6,
              }}>
                No history yet.
              </p>
            )}
            {[...history].reverse().map((item) => {
              const ts = new Date(item.askedAt).toLocaleTimeString([], {
                hour: '2-digit', minute: '2-digit',
              });
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect?.(item.question)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid var(--border-hairline)',
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-raised)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span style={{
                    display: 'block',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.6rem',
                    color: 'var(--accent-amber)',
                    marginBottom: 2,
                  }}>
                    #{item.id} · {ts}
                  </span>
                  <span style={{
                    display: 'block',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.66rem',
                    color: 'var(--text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 170,
                  }} title={item.question}>
                    {item.question}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
