/**
 * components/InputBar.jsx
 * Gemini-style bottom-docked input bar with gradient border on focus,
 * suggestion chips, and the Compile Reveal typewriter.
 */
import React, { useEffect, useRef, useState } from 'react';

const SUGGESTIONS = [
  "Top 5 products by revenue",
  "Monthly revenue trend",
  "Orders by country",
  "Customers by loyalty tier",
  "Avg order value by category",
];

function useTypewriter(text) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!text) { setDisplayed(''); setDone(false); return; }
    setDisplayed('');
    setDone(false);
    let i = 0;
    const perChar = Math.min(20, Math.floor(500 / Math.max(text.length, 1)));
    function tick() {
      i++;
      setDisplayed(text.slice(0, i));
      if (i < text.length) timerRef.current = setTimeout(tick, perChar);
      else setDone(true);
    }
    timerRef.current = setTimeout(tick, perChar);
    return () => clearTimeout(timerRef.current);
  }, [text]);

  return { displayed, done };
}

export default function InputBar({ onSubmit, loading, lastSQL, onClear }) {
  const [value, setValue]   = useState('');
  const [focused, setFocused] = useState(false);
  const textareaRef         = useRef(null);
  const { displayed, done } = useTypewriter(lastSQL);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [value]);

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const q = value.trim();
    if (!q || loading) return;
    onSubmit(q);
    setValue('');
  }

  function handleSuggestion(s) {
    if (loading) return;
    onSubmit(s);
  }

  const hasValue = value.trim().length > 0;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 260, right: 0,
      zIndex: 100,
      background: 'linear-gradient(to top, var(--bg) 60%, transparent)',
      padding: '1.5rem 2rem 1.5rem',
    }}>
      {/* SQL typewriter strip */}
      {lastSQL && !loading && (
        <div className="fade-in" style={{
          maxWidth: 760, margin: '0 auto 0.75rem',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          padding: '0.5rem 0.85rem',
          display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
        }}>
          <span style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', flexShrink: 0, marginTop: 1 }}>›</span>
          <pre style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
            color: 'var(--text-2)', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            lineHeight: 1.6, flex: 1, overflow: 'hidden',
          }}>
            {displayed}{!done && <span className="cursor-blink" />}
          </pre>
        </div>
      )}

      {/* Main input card */}
      <div style={{
        maxWidth: 760, margin: '0 auto',
        borderRadius: 'var(--r-xl)',
        background: 'var(--glass)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${focused ? 'rgba(255,180,84,0.5)' : 'var(--border)'}`,
        boxShadow: focused ? '0 0 0 1px rgba(255,180,84,0.2), var(--shadow-md)' : 'var(--shadow-md)',
        transition: 'border-color var(--t-mid), box-shadow var(--t-mid)',
        overflow: 'hidden',
      }} className={focused ? 'console-pulse' : ''}>

        {/* Textarea */}
        <div style={{ padding: '1rem 1.25rem 0.25rem', position: 'relative' }}>
          <textarea
            ref={textareaRef}
            id="console-input"
            rows={1}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Ask anything about your data…"
            disabled={loading}
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-1)', fontFamily: 'var(--font-ui)', fontSize: '0.95rem',
              lineHeight: 1.6, resize: 'none', minHeight: 28,
              caretColor: 'var(--amber)',
            }}
            aria-label="Ask a question about your data"
          />
        </div>

        {/* Bottom row: suggestions + send button */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.4rem 0.75rem 0.75rem', gap: '0.5rem',
        }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'nowrap', overflow: 'hidden' }}>
            {!hasValue && !loading && SUGGESTIONS.slice(0, 3).map(s => (
              <button key={s} onClick={() => handleSuggestion(s)}
                style={{
                  fontFamily: 'var(--font-ui)', fontSize: '0.72rem',
                  color: 'var(--text-2)', background: 'var(--surface)',
                  border: '1px solid var(--border)', borderRadius: 'var(--r-full)',
                  padding: '0.25rem 0.7rem', whiteSpace: 'nowrap',
                  cursor: 'pointer', transition: 'all var(--t-fast)',
                  flexShrink: 0,
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
            style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: (loading || !hasValue) ? 'var(--surface)' : 'var(--grad-brand)',
              border: 'none', cursor: (loading || !hasValue) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all var(--t-fast)',
              boxShadow: (!loading && hasValue) ? '0 0 16px rgba(255,180,84,0.3)' : 'none',
            }}
            aria-label={loading ? 'Running...' : 'Send query'}
          >
            {loading ? (
              <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="12" cy="12" r="9" stroke="#FFB454" strokeWidth="2" fill="none" strokeDasharray="28" strokeDashoffset="14"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M7 11L12 6L17 11M12 6V18" stroke={hasValue ? '#000' : '#444'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Keyboard hint */}
      <p style={{
        textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
        color: 'var(--text-3)', marginTop: '0.5rem',
      }}>
        Enter to run · Shift+Enter for newline
      </p>
    </div>
  );
}
