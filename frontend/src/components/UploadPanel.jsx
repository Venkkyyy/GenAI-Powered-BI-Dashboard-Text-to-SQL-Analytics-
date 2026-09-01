/**
 * components/UploadPanel.jsx
 *
 * Drag-and-drop CSV uploader with:
 * - 1-click Sample Dataset loader
 * - Direct download of sample CSV
 * - Active dataset column schema preview
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
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Upload failed'); return; }
      onUpload(json);
    } catch {
      setError('Network error — is the backend running?');
    } finally {
      setUploading(false);
    }
  }

  // 1-Click Load Sample Dataset directly from frontend
  async function loadSampleDataset() {
    setUploading(true);
    setError(null);
    try {
      const response = await fetch('/sample_sales_data.csv');
      const blob = await response.blob();
      const file = new File([blob], 'sample_sales_data.csv', { type: 'text/csv' });
      await handleFile(file);
    } catch {
      setError('Could not load sample dataset.');
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
      <div style={{ padding: '0 0.85rem 0.85rem' }}>
        {/* Active dataset card */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: 12,
          padding: '0.85rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>📄 {dataset.originalFilename}</p>
              <p style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>
                {dataset.rowCount.toLocaleString()} rows · {dataset.columns.length} columns
              </p>
            </div>
            <button
              onClick={onClear}
              title="Switch back to Live PostgreSQL"
              style={{
                fontSize: '0.7rem',
                color: '#e11d48',
                background: '#fff1f2',
                border: '1px solid #ffe4e6',
                cursor: 'pointer',
                padding: '2px 8px',
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              Clear ✕
            </button>
          </div>

          {/* Column list */}
          <div style={{
            maxHeight: 120,
            overflowY: 'auto',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            marginTop: 8,
          }}>
            {dataset.columns.map(col => (
              <span key={col.name} style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                fontWeight: 600,
                background: col.type === 'NUMBER' ? '#eef2ff' : col.type === 'DATE' ? '#ecfdf5' : '#f1f5f9',
                color: col.type === 'NUMBER' ? '#4f46e5' : col.type === 'DATE' ? '#059669' : '#475569',
                border: `1px solid ${col.type === 'NUMBER' ? '#c7d2fe' : col.type === 'DATE' ? '#a7f3d0' : '#e2e8f0'}`,
                borderRadius: 4,
                padding: '1px 5px',
              }}>
                {col.name}
              </span>
            ))}
          </div>

          <p style={{ fontSize: '0.65rem', color: '#16a34a', marginTop: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>●</span> Queries execute on this file (in-memory)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0.85rem 0.85rem' }}>
      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#4f46e5' : '#cbd5e1'}`,
          borderRadius: 12,
          padding: '1.1rem 0.75rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? '#eef2ff' : '#f8fafc',
          transition: 'all 150ms ease',
        }}
      >
        <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>
          {uploading ? '⏳' : '📁'}
        </div>
        <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>
          {uploading ? 'Parsing dataset…' : 'Upload CSV / TSV'}
        </p>
        <p style={{ fontSize: '0.65rem', color: '#64748b' }}>
          Drag & drop or click to browse
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
        <p style={{ fontSize: '0.68rem', color: '#e11d48', marginTop: 6, padding: '4px 0' }}>
          ⚠ {error}
        </p>
      )}

      {/* 1-Click Load Sample Button */}
      <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button
          onClick={loadSampleDataset}
          disabled={uploading}
          style={{
            width: '100%',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            padding: '5px 8px',
            fontSize: '0.72rem',
            fontWeight: 600,
            color: '#4f46e5',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 120ms ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
          onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
        >
          ✨ 1-Click: Load Sample Sales CSV
        </button>

        <a
          href="/sample_sales_data.csv"
          download="sample_sales_data.csv"
          style={{
            fontSize: '0.65rem',
            color: '#64748b',
            textAlign: 'center',
            textDecoration: 'none',
            padding: '2px',
          }}
        >
          📥 Download sample_sales_data.csv
        </a>
      </div>
    </div>
  );
}
