/**
 * components/UploadPanel.jsx
 * Drag-and-drop CSV/TSV upload panel shown in the sidebar.
 * Displays dataset schema preview + clear button when loaded.
 */
import React, { useCallback, useRef, useState } from 'react';

export default function UploadPanel({ dataset, onUpload, onClear }) {
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState(null);
  const inputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append('file', file);
    try {
      const res  = await fetch('/api/upload', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Upload failed'); return; }
      onUpload(json);
    } catch {
      setError('Network error — is the backend running?');
    } finally {
      setUploading(false);
    }
  }

  const onDrop = useCallback(e => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const onDragOver = useCallback(e => { e.preventDefault(); setDragging(true); }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);

  if (dataset) {
    return (
      <div style={{ padding: '0 0.75rem 0.75rem' }}>
        {/* Active dataset card */}
        <div style={{
          background: '#fff8e7',
          border: '1px solid #f9ab00',
          borderRadius: 10,
          padding: '0.75rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#202124' }}>📄 {dataset.originalFilename}</p>
              <p style={{ fontSize: '0.68rem', color: '#5f6368', marginTop: 2 }}>
                {dataset.rowCount.toLocaleString()} rows · {dataset.columns.length} columns
              </p>
            </div>
            <button
              onClick={onClear}
              title="Remove dataset"
              style={{
                fontSize: '0.7rem', color: '#d93025', background: 'none', border: 'none',
                cursor: 'pointer', padding: '2px 6px', borderRadius: 4,
                transition: 'background 120ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fce8e6'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >✕</button>
          </div>

          {/* Column list */}
          <div style={{
            maxHeight: 120, overflowY: 'auto',
            display: 'flex', flexWrap: 'wrap', gap: 3,
          }}>
            {dataset.columns.map(col => (
              <span key={col.name} style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                background: col.type === 'NUMBER' ? '#e8f0fe' : col.type === 'DATE' ? '#e6f4ea' : '#f1f3f4',
                color: col.type === 'NUMBER' ? '#1a73e8' : col.type === 'DATE' ? '#1e8e3e' : '#5f6368',
                borderRadius: 4, padding: '1px 5px',
              }}>
                {col.name}
              </span>
            ))}
          </div>

          <p style={{ fontSize: '0.65rem', color: '#f29900', marginTop: 6, fontWeight: 500 }}>
            ✓ Queries run on this file
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0.75rem 0.75rem' }}>
      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#1a73e8' : '#dadce0'}`,
          borderRadius: 10,
          padding: '1.25rem 0.75rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? '#e8f0fe' : '#fafafa',
          transition: 'all 150ms',
        }}
      >
        <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>
          {uploading ? '⏳' : '📂'}
        </div>
        <p style={{ fontSize: '0.78rem', fontWeight: 500, color: '#202124', marginBottom: 4 }}>
          {uploading ? 'Uploading…' : 'Upload your data'}
        </p>
        <p style={{ fontSize: '0.68rem', color: '#5f6368' }}>
          CSV or TSV · up to 5MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.txt"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])}
        />
      </div>

      {error && (
        <p style={{ fontSize: '0.68rem', color: '#d93025', marginTop: 6, padding: '4px 0' }}>
          ⚠ {error}
        </p>
      )}

      <p style={{ fontSize: '0.65rem', color: '#9aa0a6', marginTop: 6, textAlign: 'center', lineHeight: 1.5 }}>
        Or query the built-in e-commerce demo data below
      </p>
    </div>
  );
}
