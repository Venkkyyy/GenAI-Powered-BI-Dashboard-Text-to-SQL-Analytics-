/**
 * components/Sidebar.jsx  v2 — Light theme
 * Left sidebar: logo, upload panel, data source info, history
 */
import React from 'react';
import UploadPanel from './UploadPanel';

const SB = {
  width: 280,
  flexShrink: 0,
  height: '100vh',
  position: 'fixed',
  left: 0, top: 0,
  display: 'flex',
  flexDirection: 'column',
  background: '#fafafa',
  borderRight: '1px solid var(--border)',
  zIndex: 50,
  overflowY: 'auto',
};

const SECTION_LABEL = {
  fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'var(--text-3)',
  padding: '0.75rem 1rem 0.3rem',
};

export default function Sidebar({ history, dataset, onNew, onSelect, onUpload, onClearDataset }) {
  return (
    <aside style={SB} className="sidebar" aria-label="Sidebar">

      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        padding: '1rem 1rem 0.75rem',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: '#202124',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.9rem', fontWeight: 700, color: '#FFB454',
          fontFamily: 'var(--font-mono)', flexShrink: 0,
        }}>Q</div>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.1em', color: '#202124' }}>
            QUERYLINE
          </p>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-3)', marginTop: -1 }}>GenAI BI Dashboard</p>
        </div>
      </div>

      {/* ── New query ─────────────────────────────────────────────────── */}
      <div style={{ padding: '0.75rem' }}>
        <button
          id="new-query-btn"
          className="btn-outline"
          onClick={onNew}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New query
        </button>
      </div>

      {/* ── Upload data ───────────────────────────────────────────────── */}
      <p style={SECTION_LABEL}>Data Source</p>
      <UploadPanel dataset={dataset} onUpload={onUpload} onClear={onClearDataset} />

      {/* ── History ───────────────────────────────────────────────────── */}
      {history.length > 0 && (
        <>
          <p style={SECTION_LABEL}>History</p>
          <div style={{ overflowY: 'auto', flex: 1, paddingBottom: '4rem' }}>
            {[...history].reverse().map(item => (
              <button
                key={item.id}
                onClick={() => onSelect?.(item.question)}
                style={{
                  display: 'block', width: 'calc(100% - 16px)',
                  margin: '1px 8px', textAlign: 'left',
                  background: 'none', border: 'none',
                  borderRadius: 8, padding: '0.5rem 0.6rem',
                  cursor: 'pointer', transition: 'background var(--t-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{
                  display: 'block', fontSize: '0.8rem', color: 'var(--text-1)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  lineHeight: 1.4,
                }}>
                  {item.question}
                </span>
                <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-3)', marginTop: 1 }}>
                  #{item.id} · {new Date(item.askedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
