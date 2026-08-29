/**
 * App.jsx — Queryline root component (Step 1 scaffold)
 * This renders a holding screen confirming the stack is wired.
 * It will be replaced with the full console UI in Step 5.
 */
import React, { useEffect, useState } from 'react'

export default function App() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(data => { setHealth(data); setLoading(false) })
      .catch(() => { setHealth({ status: 'error' }); setLoading(false) })
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.5rem',
      padding: '2rem',
    }}>
      {/* Wordmark */}
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '1.5rem',
        fontWeight: 600,
        letterSpacing: '0.15em',
        color: 'var(--accent-amber)',
      }}>
        QUERYLINE
      </p>

      {/* Status card */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-hairline)',
        borderRadius: '6px',
        padding: '1.5rem 2rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        minWidth: '320px',
      }}>
        <p style={{ marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
          Backend health check
        </p>
        {loading ? (
          <p>— checking... <span className="cursor-blink" /></p>
        ) : (
          <>
            <p>status: <span style={{
              color: health?.status === 'ok' ? '#4ade80' :
                     health?.status === 'degraded' ? 'var(--accent-amber)' : '#f87171'
            }}>{health?.status ?? 'unknown'}</span></p>
            <p>database: {health?.checks?.database ?? '—'}</p>
            <p>timestamp: {health?.timestamp ?? '—'}</p>
          </>
        )}
      </div>

      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
      }}>
        Step 1 scaffold — full UI coming in Step 5
      </p>
    </div>
  )
}
