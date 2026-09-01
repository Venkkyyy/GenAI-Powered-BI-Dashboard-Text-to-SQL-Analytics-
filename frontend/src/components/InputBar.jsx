/**
 * components/InputBar.jsx
 *
 * Antigravity Console Bar.
 * Floating rounded card at the bottom of the screen with auto-grow textarea,
 * quick-suggestion tags, and animated submit state.
 */
import React, { useEffect, useRef, useState } from 'react';

const SUGGESTIONS = [
  "Top 5 products by revenue",
  "Monthly revenue trend",
  "Orders by country",
  "Customers by loyalty tier",
  "Average order value",
];

export default function InputBar({ onSubmit, loading, lastSQL, dataset }) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [value]);

  function submit() {
    const q = value.trim();
    if (!q || loading) return;
    onSubmit(q);
    setValue('');
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  const hasValue = value.trim().length > 0;

  return (
    <div
      className="input-bar"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 280,
        right: 0,
        zIndex: 100,
        background: 'linear-gradient(to top, rgba(255,255,255,0.98) 75%, rgba(255,255,255,0))',
        padding: '0.75rem 2rem 1.5rem',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {/* Dataset notification pill if active */}
        {dataset && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              background: '#eef2ff',
              border: '1px solid #c7d2fe',
              color: '#4338ca',
              padding: '2px 8px',
              borderRadius: 999,
              fontWeight: 600,
            }}>
              📄 Active Dataset: {dataset.tableName} ({dataset.rowCount.toLocaleString()} rows)
            </span>
          </div>
        )}

        {/* Floating Input Card */}
        <div
          style={{
            background: '#ffffff',
            border: `1.5px solid ${focused ? '#4f46e5' : '#cbd5e1'}`,
            borderRadius: 20,
            boxShadow: focused
              ? '0 10px 30px -5px rgba(79, 70, 229, 0.15), 0 0 0 3px rgba(79, 70, 229, 0.1)'
              : '0 10px 25px -5px rgba(0, 0, 0, 0.06), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
            transition: 'all 180ms ease',
            overflow: 'hidden',
          }}
        >
          {/* Textarea Field */}
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
              placeholder={
                dataset
                  ? `Ask a question about ${dataset.tableName}... (e.g. "top records by ${dataset.columns[0]?.name || 'value'}")`
                  : 'Ask any question about your data in plain English…'
              }
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#0f172a',
                fontFamily: 'var(--font-body)',
                fontSize: '0.95rem',
                lineHeight: 1.5,
                resize: 'none',
                minHeight: 26,
              }}
              aria-label="Ask a question about your data"
            />
          </div>

          {/* Bottom Bar inside input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.2rem 0.75rem 0.65rem',
            gap: '0.5rem',
          }}>
            {/* Suggestion Pills */}
            <div style={{ display: 'flex', gap: '0.35rem', overflow: 'hidden', flex: 1 }}>
              {!hasValue && !loading && SUGGESTIONS.slice(0, 3).map(s => (
                <button
                  key={s}
                  onClick={() => onSubmit(s)}
                  className="btn-ghost-pill"
                  style={{ fontSize: '0.72rem', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Submit Arrow Button */}
            <button
              id="console-submit"
              onClick={submit}
              disabled={loading || !hasValue}
              aria-label={loading ? 'Processing…' : 'Run Query'}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                flexShrink: 0,
                background: (loading || !hasValue) ? '#f1f5f9' : '#09090b',
                color: (loading || !hasValue) ? '#94a3b8' : '#ffffff',
                border: 'none',
                cursor: (loading || !hasValue) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 150ms ease',
                boxShadow: (!loading && hasValue) ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
              }}
            >
              {loading ? (
                <svg width="15" height="15" viewBox="0 0 24 24" className="spin">
                  <circle cx="12" cy="12" r="9" stroke="#4f46e5" strokeWidth="2.5" fill="none" strokeDasharray="30" strokeDashoffset="15" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M7 11L12 6L17 11M12 6V18" stroke={hasValue ? '#ffffff' : '#94a3b8'} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Helper footnote */}
        <p style={{
          textAlign: 'center',
          fontSize: '0.65rem',
          color: '#94a3b8',
          fontFamily: 'var(--font-heading)',
          fontWeight: 500,
        }}>
          Press <kbd style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, border: '1px solid #e2e8f0', color: '#475569' }}>Enter ↵</kbd> to analyze · Powered by Antigravity GenAI Text-to-SQL
        </p>
      </div>
    </div>
  );
}
