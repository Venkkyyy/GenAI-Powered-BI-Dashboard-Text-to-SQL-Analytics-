/**
 * components/QueryChart.jsx
 * Renders the correct Recharts chart type based on the backend's auto-selection.
 * Supported: bar, time_series, pie, scatter, table
 */
import React from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line,
  PieChart, Pie, Cell,
  ScatterChart, Scatter,
} from 'recharts';

const AMBER = '#FFB454';
const COOL  = '#8ab4f8';
const CHART_COLORS = ['#FFB454', '#8ab4f8', '#c58af9', '#81c995', '#f87171', '#e8a960'];

const tooltipStyle = {
  backgroundColor: 'rgba(18,18,24,0.95)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  color: '#e8eaed',
  fontFamily: "'Google Sans Mono', 'Courier New', monospace",
  fontSize: '0.72rem',
  backdropFilter: 'blur(8px)',
};

const axisStyle = {
  fill: '#5f6368',
  fontFamily: "'Google Sans Mono', monospace",
  fontSize: 10.5,
};

function truncLabel(v, max = 14) {
  const s = String(v);
  return s.length > max ? s.slice(0, max) + '…' : s;
}

/* ── Bar chart ─────────────────────────────────────────────────────────────── */
function BarChartView({ data, columnMap }) {
  const xKey  = columnMap.xAxis ?? Object.keys(data[0])[0];
  const yKeys = Array.isArray(columnMap.yAxis) ? columnMap.yAxis : [columnMap.yAxis ?? Object.keys(data[0])[1]];
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#232A38" vertical={false} />
        <XAxis dataKey={xKey} tick={axisStyle} tickFormatter={truncLabel} angle={-30} textAnchor="end" interval={0} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#232A38' }} />
        {yKeys.length > 1 && <Legend wrapperStyle={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#7C8698' }} />}
        {yKeys.map((k, i) => (
          <Bar key={k} dataKey={k} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[3, 3, 0, 0]} maxBarSize={48} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Time-series (line) chart ──────────────────────────────────────────────── */
function TimeSeriesView({ data, columnMap }) {
  const xKey  = columnMap.xAxis ?? Object.keys(data[0])[0];
  const yKeys = Array.isArray(columnMap.yAxis) ? columnMap.yAxis : [columnMap.yAxis ?? Object.keys(data[0])[1]];
  // Format date labels
  const formatted = data.map(row => ({
    ...row,
    [xKey]: typeof row[xKey] === 'string' ? row[xKey].slice(0, 10) : row[xKey],
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={formatted} margin={{ top: 10, right: 16, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#232A38" />
        <XAxis dataKey={xKey} tick={axisStyle} angle={-30} textAnchor="end" interval="preserveStartEnd" />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        {yKeys.length > 1 && <Legend wrapperStyle={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#7C8698' }} />}
        {yKeys.map((k, i) => (
          <Line key={k} type="monotone" dataKey={k} stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS[i % CHART_COLORS.length] }} activeDot={{ r: 5 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ── Pie chart ─────────────────────────────────────────────────────────────── */
function PieChartView({ data, columnMap }) {
  const labelKey = columnMap.label ?? Object.keys(data[0])[0];
  const valueKey = columnMap.value ?? Object.keys(data[0])[1];
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey={valueKey} nameKey={labelKey}
          cx="50%" cy="50%" outerRadius={90}
          labelLine={false}
          label={({ name, percent }) => `${truncLabel(name, 10)} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [Number(v).toLocaleString(), valueKey]} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ── Scatter chart ─────────────────────────────────────────────────────────── */
function ScatterChartView({ data, columnMap }) {
  const xKey = columnMap.xAxis ?? Object.keys(data[0])[0];
  const yKey = typeof columnMap.yAxis === 'string' ? columnMap.yAxis : (columnMap.yAxis?.[0] ?? Object.keys(data[0])[1]);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart margin={{ top: 10, right: 16, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#232A38" />
        <XAxis dataKey={xKey} name={xKey} tick={axisStyle} />
        <YAxis dataKey={yKey} name={yKey} tick={axisStyle} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
        <Scatter data={data} fill={AMBER} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

/* ── Data table ────────────────────────────────────────────────────────────── */
function TableView({ data }) {
  if (!data || data.length === 0) return null;
  const cols = Object.keys(data[0]);
  const tableStyle = {
    width: '100%', borderCollapse: 'collapse',
    fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem',
  };
  const thStyle = {
    textAlign: 'left', padding: '6px 10px',
    color: '#7C8698', borderBottom: '1px solid #232A38',
    fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em',
  };
  const tdStyle = {
    padding: '6px 10px', color: '#E9EDF4',
    borderBottom: '1px solid #1a1f2b',
  };
  return (
    <div style={{ overflowX: 'auto', maxHeight: 260, overflowY: 'auto', marginTop: 4 }}>
      <table style={tableStyle}>
        <thead>
          <tr>{cols.map(c => <th key={c} style={thStyle}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : '#0d1018' }}>
              {cols.map(c => <td key={c} style={tdStyle}>{row[c] ?? '—'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Main export ───────────────────────────────────────────────────────────── */
export default function QueryChart({ chartType, data, columnMap }) {
  if (!data || data.length === 0) {
    return (
      <p style={{ color: '#7C8698', fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.8rem', padding: '1rem 0' }}>
        No rows returned.
      </p>
    );
  }

  switch (chartType) {
    case 'bar':         return <BarChartView    data={data} columnMap={columnMap ?? {}} />;
    case 'time_series': return <TimeSeriesView  data={data} columnMap={columnMap ?? {}} />;
    case 'pie':         return <PieChartView    data={data} columnMap={columnMap ?? {}} />;
    case 'scatter':     return <ScatterChartView data={data} columnMap={columnMap ?? {}} />;
    default:            return <TableView       data={data} />;
  }
}
