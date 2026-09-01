/**
 * components/InputBar.jsx  v2 — Light theme
 * Bottom-docked Gemini-style input: white surface, blue focus ring,
 * suggestion chips, SQL typewriter, amber send button
 */
import React, { useEffect, useRef, useState } from 'react';

const SUGGESTIONS = [
  "Top 5 products by revenue",
  "Monthly revenue trend",
  "Orders by country",
  "Customers by loyalty tier",
  "Average order value",
];

function useTypewriter(text) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!text) { setDisplayed(''); setDone(false); return; }
    setDisplayed(''); setDone(false);
    let i = 0;
    const perChar = Math.min(18, Math.floor(450 / Math.max(text.length, 1)));
    function tick() {
      i++;
      setDisplayed(text.slice(0, i));
      if (i < text.length) ref.current = setTimeout(tick, perChar);
      else setDone(true);
    }
    ref.current = setTimeout(tick, perChar);
    return () => clearTimeout(ref.current);
  }, [text]);
  return { displayed, done };
}

export default function InputBar({ onSubmit, loading, lastSQL, dataset }) {
  const [value, setValue]   = useState('');
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef(null);
  const { displayed, done } = useTypewriter(lastSQL);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [value]);

  function submit() {
    const q = value.trim();
    if (!q || loading) return;
    onSubmit(q);
    setValue('');
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  }

  const hasValue = value.trim().length > 0;

  return (
    <div className="input-bar" style={{
      position: 'fixed', bottom: 0, left: 280, right: 0,
      zIndex: 100,
      background: 'linear-gradient(to top, #ffffff 70%, rgba(255,255,255,0))',
      padding: '1rem 2rem 1.25rem',
    }}>
      {/* SQL typewriter strip */}
      {lastSQL && !loading && (
        <div className="fade-in" style={{
          maxWidth: 760, margin: '0 auto 0.6rem',
          background: '#f1f3f4', borderRadius: 8,
          padding: '0.4rem 0.85rem',
          display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
          border: '1px solid #e0e0e0',
        }}>
          <span style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', marginTop: 1, flexShrink: 0 }}>›</span>
          <pre style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.67rem', color: 'var(--text-2)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.6, flex: 1,
          }}>
            {displayed}{!done && <span className="cursor-blink" />}
          </pre>
        </div>
      )}

      {/* Dataset badge */}
      {dataset && (
        <div style={{ maxWidth: 760, margin: '0 auto 0.4rem', display: 'flex' }}>
          <span style={{
            fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
            background: '#fff8e7', border: '1px solid #f9ab00',
            borderRadius: 4, padding: '1px 8px', color: '#b06000',
          }}>
            📄 Querying: {dataset.tableName} ({dataset.rowCount.toLocaleString()} rows)
          </span>
        </div>
      )}

      {/* Main input */}
      <div style={{
        maxWidth: 760, margin: '0 auto',
        background: '#fff',
        border: `1.5px solid ${focused ? 'var(--blue)' : 'var(--border)'}`,
        borderRadius: 24,
        boxShadow: focused ? '0 0 0 3px rgba(26,115,232,0.12)' : 'var(--shadow-sm)',
        transition: 'all var(--t-mid)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '0.85rem 1.25rem 0.25rem' }}>
          <textarea
            ref={textareaRef}
            id="console-input"
            rows={1}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={loading}
            placeholder={dataset ? `Ask anything about ${dataset.tableName}…` : 'Ask anything about your data…'}
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-1)', fontFamily: 'var(--font-ui)', fontSize: '0.95rem',
              lineHeight: 1.6, resize: 'none', minHeight: 28,
              caretColor: 'var(--blue)',
            }}
            aria-label="Ask a question about your data"
          />
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.2rem 0.75rem 0.65rem', gap: '0.5rem',
        }}>
          {/* Suggestion chips */}
          <div style={{ display: 'flex', gap: '0.35rem', overflow: 'hidden', flex: 1, flexWrap: 'nowrap' }}>
            {!hasValue && !loading && SUGGESTIONS.slice(0, 3).map(s => (
              <button key={s} onClick={() => onSubmit(s)}
                style={{
                  fontFamily: 'var(--font-ui)', fontSize: '0.7rem', fontWeight: 500,
                  color: 'var(--text-2)', background: 'var(--bg-2)',
                  border: '1px solid var(--border)', borderRadius: 20,
                  padding: '0.2rem 0.7rem', whiteSpace: 'nowrap',
                  cursor: 'pointer', transition: 'all var(--t-fast)', flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--amber)'; e.currentTarget.style.color = 'var(--amber)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}
              >{s}</button>
            ))}
          </div>

          {/* Send button */}
          <button
            id="console-submit"
            onClick={submit}
            disabled={loading || !hasValue}
            aria-label={loading ? 'Running…' : 'Send'}
            style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: (loading || !hasValue) ? '#f1f3f4' : '#202124',
              border: 'none', cursor: (loading || !hasValue) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all var(--t-fast)',
            }}
          >
            {loading ? (
              <svg width="14" height="14" viewBox="0 0 24 24" style={{ animation: 'spin 0.9s linear infinite' }}>
                <circle cx="12" cy="12" r="9" stroke="#f29900" strokeWidth="2.5" fill="none" strokeDasharray="30" strokeDashoffset="15"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M7 11L12 6L17 11M12 6V18" stroke={hasValue ? '#ffffff' : '#9aa0a6'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.6rem', color: 'var(--text-3)', marginTop: '0.4rem', fontFamily: 'var(--font-mono)' }}>
        Enter ↵ to run · Shift+Enter for newline
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
