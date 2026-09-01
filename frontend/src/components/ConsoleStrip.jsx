/**
 * components/ConsoleStrip.jsx
 * The persistent terminal-style input bar pinned at the top of the app.
 * Features: amber prompt symbol, blinking block cursor, typing animation,
 * the "Compile Reveal" typewriter effect after a query resolves.
 */
import React, { useEffect, useRef, useState } from 'react';

const STRIP = {
  background: 'var(--surface)',
  borderBottom: '1px solid var(--border-hairline)',
  padding: '0.85rem 1.5rem',
  position: 'sticky',
  top: 0,
  zIndex: 100,
};

const PROMPT_ROW = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  maxWidth: 900,
  margin: '0 auto',
};

const INPUT_STYLE = {
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.92rem',
  flex: 1,
  caretColor: 'var(--accent-amber)',
  letterSpacing: '0.01em',
};

const SUBMIT_BTN = (loading) => ({
  fontFamily: 'var(--font-mono)',
  fontSize: '0.75rem',
  padding: '0.35rem 0.85rem',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--accent-amber)',
  color: loading ? 'var(--text-muted)' : 'var(--accent-amber)',
  background: 'transparent',
  cursor: loading ? 'not-allowed' : 'pointer',
  transition: 'background var(--transition-fast), color var(--transition-fast)',
  flexShrink: 0,
});

// Typewriter animation — types the SQL string char by char
function useTypewriter(text, speed = 18) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone]           = useState(false);
  const frame = useRef(null);

  useEffect(() => {
    if (!text) { setDisplayed(''); setDone(false); return; }
    setDisplayed('');
    setDone(false);
    let i = 0;
    // Cap at ~400ms total regardless of length
    const perChar = Math.min(speed, Math.floor(400 / text.length));

    function tick() {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i < text.length) {
        frame.current = setTimeout(tick, perChar);
      } else {
        setDone(true);
      }
    }
    frame.current = setTimeout(tick, perChar);
    return () => clearTimeout(frame.current);
  }, [text]);

  return { displayed, done };
}

export default function ConsoleStrip({ onSubmit, loading, lastSQL }) {
  const [value, setValue]       = useState('');
  const [pulse, setPulse]       = useState(false);
  const inputRef                = useRef(null);
  const { displayed: typedSQL, done: typeDone } = useTypewriter(lastSQL ?? '');

  // When typewriter finishes, pulse the amber underline
  useEffect(() => {
    if (typeDone && lastSQL) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 700);
      return () => clearTimeout(t);
    }
  }, [typeDone, lastSQL]);

  function handleSubmit(e) {
    e?.preventDefault();
    const q = value.trim();
    if (!q || loading) return;
    onSubmit(q);
    setValue('');
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  // Show typewriter output only when there's SQL to show and not currently typing a new question
  const showTypewriter = lastSQL && !loading;

  return (
    <div style={STRIP}>
      {/* ── Main prompt row ─────────────────────────────────────── */}
      <form onSubmit={handleSubmit} style={PROMPT_ROW}>
        {/* Amber prompt symbol */}
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1rem',
          color: 'var(--accent-amber)',
          userSelect: 'none',
          flexShrink: 0,
        }}>▶</span>

        <input
          ref={inputRef}
          id="console-input"
          type="text"
          style={INPUT_STYLE}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder="ask a question about your data…"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={loading}
          aria-label="Ask a question about your data"
        />

        {/* Blinking cursor when empty */}
        {!value && !loading && <span className="cursor-blink" aria-hidden />}

        <button
          type="submit"
          id="console-submit"
          disabled={loading || !value.trim()}
          style={SUBMIT_BTN(loading || !value.trim())}
        >
          {loading ? 'running…' : 'run ↵'}
        </button>
      </form>

      {/* ── Compile Reveal — typewriter SQL output ──────────────── */}
      {showTypewriter && (
        <div
          style={{
            maxWidth: 900,
            margin: '0.55rem auto 0',
            position: 'relative',
            paddingBottom: 2,
          }}
          className={pulse ? 'console-pulse' : ''}
        >
          <pre style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            lineHeight: 1.5,
            paddingLeft: '1.6rem',
          }}>
            <span style={{ color: 'var(--accent-amber)', marginRight: 6 }}>$</span>
            {typedSQL}
            {!typeDone && <span className="cursor-blink" aria-hidden />}
          </pre>
        </div>
      )}

      {/* ── Loading indicator ────────────────────────────────────── */}
      {loading && (
        <div style={{ maxWidth: 900, margin: '0.4rem auto 0', paddingLeft: '1.6rem' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--accent-amber)',
          }}>
            generating sql<span className="cursor-blink" aria-hidden />
          </span>
        </div>
      )}
    </div>
  );
}
