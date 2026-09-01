/**
 * utils/sqlHighlight.jsx
 *
 * Professional SQL Formatter & Syntax Highlighter.
 * - Parses continuous SQL strings into clean, indented line-by-line format.
 * - Formats SELECT, FROM, JOIN, WHERE, GROUP BY, ORDER BY, LIMIT onto distinct lines.
 * - Renders IDE line numbers and syntax highlighted tokens.
 */
import React from 'react';

const KEYWORDS = new Set([
  'SELECT','FROM','WHERE','JOIN','LEFT','RIGHT','INNER','OUTER','FULL','CROSS',
  'ON','AND','OR','NOT','IN','IS','NULL','AS','GROUP','BY','ORDER',
  'HAVING','LIMIT','OFFSET','DISTINCT','COUNT','SUM','AVG','MIN','MAX',
  'CASE','WHEN','THEN','ELSE','END','WITH','UNION','ALL','DATE_TRUNC',
  'INTERVAL','BETWEEN','LIKE','ILIKE','EXISTS','COALESCE','CAST','DESC','ASC',
  'OVER','PARTITION','ROW_NUMBER','RANK','DENSE_RANK'
]);

/**
 * Cleanly formats a continuous SQL query string onto multiple lines.
 */
export function formatSQL(sql) {
  if (!sql) return '';

  let cleaned = sql.trim().replace(/;+$/, '').replace(/\s+/g, ' ');

  // Insert line breaks before major SQL clauses
  const clauseKeywords = [
    'SELECT',
    'FROM',
    'LEFT JOIN',
    'RIGHT JOIN',
    'INNER JOIN',
    'CROSS JOIN',
    'JOIN',
    'WHERE',
    'GROUP BY',
    'HAVING',
    'ORDER BY',
    'LIMIT',
    'OFFSET',
    'UNION ALL',
    'UNION'
  ];

  clauseKeywords.forEach(keyword => {
    const re = new RegExp(`\\s*\\b(${keyword})\\b\\s*`, 'gi');
    cleaned = cleaned.replace(re, `\n$1 `);
  });

  // Handle AND / OR indentation inside WHERE
  cleaned = cleaned.replace(/\s+\b(AND|OR)\b\s+/gi, '\n  $1 ');

  // Format comma separated column lists inside SELECT
  const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);

  const formattedLines = [];
  lines.forEach(line => {
    if (/^SELECT\b/i.test(line)) {
      const afterSelect = line.substring(6).trim();
      const cols = afterSelect.split(/,\s*(?![^()]*\))/);
      if (cols.length > 2) {
        formattedLines.push('SELECT');
        cols.forEach((col, idx) => {
          formattedLines.push(`  ${col.trim()}${idx < cols.length - 1 ? ',' : ''}`);
        });
      } else {
        formattedLines.push(line);
      }
    } else if (/^(FROM|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|WHERE|GROUP BY|HAVING|ORDER BY|LIMIT|OFFSET)/i.test(line)) {
      formattedLines.push(line);
    } else {
      formattedLines.push(`  ${line}`);
    }
  });

  return formattedLines.join('\n');
}

/**
 * Highlights a single line of SQL.
 */
export function highlightTokens(text) {
  const tokens = text.split(/(\s+|[,();*])/);
  return tokens.map((tok, i) => {
    const upper = tok.trim().toUpperCase();
    if (!tok.trim()) return <span key={i}>{tok}</span>;
    if (KEYWORDS.has(upper)) {
      return <span key={i} style={{ color: '#818cf8', fontWeight: 700 }}>{tok}</span>;
    }
    if (/^'[^']*'$/.test(tok)) {
      return <span key={i} style={{ color: '#34d399' }}>{tok}</span>;
    }
    if (/^-?\d+(\.\d+)?$/.test(tok)) {
      return <span key={i} style={{ color: '#fbbf24' }}>{tok}</span>;
    }
    if (/^[a-z_][a-z0-9_.]*$/i.test(tok)) {
      return <span key={i} style={{ color: '#38bdf8' }}>{tok}</span>;
    }
    return <span key={i} style={{ color: '#e2e8f0' }}>{tok}</span>;
  });
}

/**
 * Formatted Line-by-Line SQL Viewer with Line Numbers.
 */
export function FormattedSQLViewer({ sql }) {
  const formatted = formatSQL(sql);
  const lines = formatted.split('\n');

  return (
    <div style={{
      display: 'flex',
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: '0.78rem',
      lineHeight: 1.7,
      overflowX: 'auto',
      color: '#f8fafc',
    }}>
      {/* Line Numbers Gutter */}
      <div style={{
        userSelect: 'none',
        paddingRight: '1rem',
        marginRight: '1rem',
        borderRight: '1px solid #334155',
        color: '#64748b',
        textAlign: 'right',
        minWidth: 28,
      }}>
        {lines.map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>

      {/* Formatted Code Body */}
      <div style={{ flex: 1, whiteSpace: 'pre' }}>
        {lines.map((line, i) => (
          <div key={i}>{highlightTokens(line)}</div>
        ))}
      </div>
    </div>
  );
}
