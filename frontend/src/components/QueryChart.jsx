/**
 * components/QueryChart.jsx
 *
 * Professional BI Visualization Engine (Antigravity-inspired).
 * - Coerces strings to Numbers automatically (handles Postgres NUMERIC/SUM).
 * - Multi-series support, clean tooltips, interactive legends, gradient fills.
 * - Supports Bar, Area / Line, Donut / Pie, and Data Table views with tab switching.
 */
import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar,
  AreaChart, Area,
  LineChart, Line,
  PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend
} from 'recharts';

// Antigravity vibrant palette
const PALETTE = [
  '#4f46e5', // Indigo
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#3b82f6', // Blue
];

const customTooltipStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.96)',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: '10px 14px',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  fontFamily: "'Inter', -apple-system, sans-serif",
  fontSize: '0.8rem',
  color: '#0f172a',
  backdropFilter: 'blur(8px)',
};

function formatValue(v) {
  if (v == null) return '—';
  const n = Number(v);
  if (!isNaN(n)) {
    if (Math.abs(n) >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
    if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}k`;
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return String(v);
}

function truncate(str, max = 16) {
  if (!str) return '';
  const s = String(str);
  return s.length > max ? s.slice(0, max) + '…' : s;
}

export default function QueryChart({ chartType: defaultType = 'bar', data = [], columnMap = {} }) {
  const [activeTab, setActiveTab] = useState(
    defaultType === 'time_series' ? 'area' : defaultType === 'pie' ? 'pie' : 'bar'
  );

  // Normalize data: convert stringified numbers to actual numbers for Recharts
  const { sanitizedData, xKey, numericKeys, labelKey, valueKey } = useMemo(() => {
    if (!data || data.length === 0) {
      return { sanitizedData: [], xKey: 'name', numericKeys: [], labelKey: 'name', valueKey: 'value' };
    }

    const first = data[0];
    const keys = Object.keys(first);

    // Identify candidate keys
    const x = columnMap.xAxis || keys.find(k => isNaN(Number(first[k]))) || keys[0];
    const valKey = columnMap.value || keys.find(k => !isNaN(Number(first[k])) && k !== x) || keys[1] || keys[0];
    const lblKey = columnMap.label || x;

    const numKeys = keys.filter(k => {
      if (k === x) return false;
      return data.some(row => row[k] !== null && row[k] !== undefined && !isNaN(Number(row[k])));
    });

    const activeNumKeys = numKeys.length > 0 ? numKeys : [valKey];

    const clean = data.map(row => {
      const copy = { ...row };
      keys.forEach(k => {
        const val = row[k];
        if (val !== null && val !== undefined && !isNaN(Number(val)) && typeof val !== 'boolean') {
          copy[k] = Number(val);
        }
      });
      return copy;
    });

    return {
      sanitizedData: clean,
      xKey: x,
      numericKeys: activeNumKeys,
      labelKey: lblKey,
      valueKey: valKey,
    };
  }, [data, columnMap]);

  if (!sanitizedData || sanitizedData.length === 0) {
    return (
      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
        No chartable data returned.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* ── View Switcher Tabs ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f1f5f9',
        paddingBottom: '0.5rem',
      }}>
        <div style={{ display: 'flex', gap: 4, background: '#f8fafc', padding: 3, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          {[
            { id: 'bar', label: 'Bar', icon: '📊' },
            { id: 'area', label: 'Trend', icon: '📈' },
            { id: 'pie', label: 'Donut', icon: '🍩' },
            { id: 'table', label: 'Table', icon: '⊞' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: '0.72rem',
                fontWeight: activeTab === tab.id ? 600 : 500,
                color: activeTab === tab.id ? '#0f172a' : '#64748b',
                background: activeTab === tab.id ? '#ffffff' : 'transparent',
                boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 150ms ease',
                cursor: 'pointer',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>
          {sanitizedData.length} records
        </span>
      </div>

      {/* ── Chart Rendering ────────────────────────────────────────────── */}
      <div style={{ width: '100%', height: 280, position: 'relative', minWidth: 0 }}>
        {/* BAR CHART */}
        {activeTab === 'bar' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sanitizedData} margin={{ top: 15, right: 12, left: 0, bottom: 35 }}>
              <defs>
                <linearGradient id="barGrad0" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#67e8f9" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey={xKey}
                tick={{ fill: '#64748b', fontSize: 11, fontFamily: "'Inter', sans-serif" }}
                tickFormatter={v => truncate(v, 14)}
                angle={-25}
                textAnchor="end"
                interval={0}
                stroke="#cbd5e1"
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11, fontFamily: "'Inter', sans-serif" }}
                tickFormatter={formatValue}
                stroke="#cbd5e1"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={customTooltipStyle}
                formatter={(val, name) => [formatValue(val), name]}
                cursor={{ fill: 'rgba(241, 245, 249, 0.8)' }}
              />
              {numericKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />}
              {numericKeys.map((key, idx) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={`url(#barGrad${idx % 2})`}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={44}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* AREA / TREND CHART */}
        {activeTab === 'area' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sanitizedData} margin={{ top: 15, right: 12, left: 0, bottom: 35 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey={xKey}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={v => truncate(v, 14)}
                angle={-25}
                textAnchor="end"
                stroke="#cbd5e1"
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={formatValue}
                stroke="#cbd5e1"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={customTooltipStyle}
                formatter={(val, name) => [formatValue(val), name]}
              />
              {numericKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />}
              {numericKeys.map((key, idx) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={PALETTE[idx % PALETTE.length]}
                  strokeWidth={2.5}
                  fill={idx === 0 ? 'url(#areaGrad)' : 'url(#areaGrad2)'}
                  dot={{ r: 4, fill: PALETTE[idx % PALETTE.length], strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* DONUT / PIE CHART */}
        {activeTab === 'pie' && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sanitizedData}
                dataKey={valueKey}
                nameKey={labelKey}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={4}
                label={({ name, percent }) => `${truncate(name, 12)} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {sanitizedData.map((_, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={PALETTE[idx % PALETTE.length]}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={customTooltipStyle}
                formatter={(val, name) => [formatValue(val), name]}
              />
            </PieChart>
          </ResponsiveContainer>
        )}

        {/* DATA TABLE */}
        {activeTab === 'table' && (
          <div style={{ height: '100%', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10 }}>
                <tr>
                  {Object.keys(sanitizedData[0]).map(col => (
                    <th key={col} style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sanitizedData.map((row, rIdx) => (
                  <tr key={rIdx} style={{ background: rIdx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                    {Object.keys(row).map(col => (
                      <td key={col} style={{ padding: '8px 12px', color: '#1e293b' }}>
                        {typeof row[col] === 'number' ? formatValue(row[col]) : String(row[col] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
