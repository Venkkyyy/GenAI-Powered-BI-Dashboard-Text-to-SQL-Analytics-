/**
 * components/Sidebar.jsx
 * Antigravity sidebar with dataset manager & query session history.
 */
import React from 'react';
import UploadPanel from './UploadPanel';

export default function Sidebar({ history, dataset, onNew, onSelect, onUpload, onClearDataset }) {
  return (
    <aside
      className="sidebar"
      style={{
        width: 280,
        flexShrink: 0,
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        zIndex: 50,
        overflowY: 'auto',
      }}
    >
      {/* ── Brand Logo ────────────────────────────────────────────────── */}
      <div style={{
        padding: '1.25rem 1.25rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        borderBottom: '1px solid #f1f5f9',
      }}>
        {/* Antigravity Tri-color Delta Glyph */}
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
          <path d="M16 4L4 26H28L16 4Z" fill="#4f46e5" opacity="0.9" />
          <path d="M16 12L9 25H23L16 12Z" fill="#06b6d4" opacity="0.8" />
          <circle cx="16" cy="18" r="3" fill="#ffffff" />
        </svg>
        <div>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.95rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#09090b',
          }}>
            QUERYLINE
          </span>
          <span style={{
            display: 'block',
            fontSize: '0.62rem',
            color: '#64748b',
            fontWeight: 500,
          }}>
            GenAI BI Platform
          </span>
        </div>
      </div>

      {/* ── Action: New Analysis ──────────────────────────────────────── */}
      <div style={{ padding: '0.85rem 1rem' }}>
        <button
          onClick={onNew}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            background: '#09090b',
            color: '#ffffff',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.8rem',
            fontWeight: 600,
            padding: '0.6rem 1rem',
            borderRadius: 9999,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
          onMouseLeave={e => e.currentTarget.style.background = '#09090b'}
        >
          <span>＋</span>
          <span>New Analysis</span>
        </button>
      </div>

      {/* ── Data Source Manager ───────────────────────────────────────── */}
      <div style={{ padding: '0 0.25rem' }}>
        <p style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#94a3b8',
          padding: '0.5rem 1rem 0.25rem',
        }}>
          Data Source
        </p>
        <UploadPanel dataset={dataset} onUpload={onUpload} onClear={onClearDataset} />
      </div>

      {/* ── Query History ─────────────────────────────────────────────── */}
      {history.length > 0 && (
        <div style={{ flex: 1, padding: '0 0.5rem', marginTop: '0.5rem' }}>
          <p style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#94a3b8',
            padding: '0.5rem 0.5rem 0.25rem',
          }}>
            Recent Sessions
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[...history].reverse().map(item => (
              <button
                key={item.id}
                onClick={() => onSelect?.(item.question)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.5rem 0.65rem',
                  borderRadius: 8,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 120ms ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  color: '#1e293b',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {item.question}
                </span>
                <span style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem',
                  color: '#94a3b8',
                  marginTop: 2,
                }}>
                  #{item.id} · {new Date(item.askedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div style={{
        marginTop: 'auto',
        padding: '0.85rem 1rem',
        borderTop: '1px solid #f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem',
            fontWeight: 700,
          }}>
            A
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
            Workspace Demo
          </span>
        </div>
        <span style={{
          fontSize: '0.62rem',
          background: '#e0f2fe',
          color: '#0369a1',
          padding: '2px 6px',
          borderRadius: 4,
          fontWeight: 600,
        }}>
          v1.0
        </span>
      </div>
    </aside>
  );
}
