/**
 * components/Sidebar.jsx
 * Gemini-style left sidebar: wordmark, new query btn, history list
 */
import React, { useState } from 'react';

const SB = {
  width: 260,
  flexShrink: 0,
  height: '100vh',
  position: 'fixed',
  left: 0,
  top: 0,
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--bg-2)',
  borderRight: '1px solid var(--border)',
  zIndex: 50,
  padding: '0.75rem 0',
};

const LOGO_ROW = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  padding: '0.5rem 1rem 1rem',
};

const NEW_BTN = {
  margin: '0 0.75rem 1rem',
  padding: '0.65rem 1rem',
  borderRadius: 'var(--r-full)',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text-1)',
  fontSize: '0.85rem',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  cursor: 'pointer',
  transition: 'background var(--t-fast)',
};

const SECTION_LABEL = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  color: 'var(--text-3)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  padding: '0.5rem 1rem 0.25rem',
};

export default function Sidebar({ history, onNew, onSelect }) {
  return (
    <aside style={SB} className="sidebar" aria-label="Sidebar">
      {/* Logo */}
      <div style={LOGO_ROW}>
        <div style={{
          width: 28, height: 28,
          borderRadius: 8,
          background: 'var(--grad-brand)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8rem', fontWeight: 700, color: '#000',
          fontFamily: 'var(--font-mono)',
          flexShrink: 0,
        }}>Q</div>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          fontSize: '1rem',
          letterSpacing: '0.1em',
        }} className="grad-text">QUERYLINE</span>
      </div>

      {/* New query button */}
      <button
        id="new-query-btn"
        style={NEW_BTN}
        onClick={onNew}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        New query
      </button>

      {/* History */}
      {history.length > 0 && (
        <>
          <p style={SECTION_LABEL}>Recent</p>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {[...history].reverse().map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect?.(item.question)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '0.55rem 1rem', background: 'none', border: 'none',
                  borderRadius: 'var(--r-sm)', margin: '1px 4px',
                  width: 'calc(100% - 8px)',
                  cursor: 'pointer', transition: 'background var(--t-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{
                  display: 'block', fontSize: '0.82rem', color: 'var(--text-2)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.question}
                </span>
                <span style={{
                  display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                  color: 'var(--text-3)', marginTop: 2,
                }}>
                  #{item.id} · {new Date(item.askedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #8ab4f8, #c58af9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: 600, color: '#000',
          }}>U</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>Sign in</span>
        </div>
      </div>
    </aside>
  );
}
