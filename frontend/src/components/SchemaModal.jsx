/**
 * components/SchemaModal.jsx
 *
 * Interactive Schema Explorer Modal.
 * Allows users to inspect database tables, columns, and data types with 1-click sample queries.
 */
import React, { useState } from 'react';

const TABLES_METADATA = [
  {
    name: 'products',
    description: 'E-commerce product catalog with inventory pricing and categories',
    columns: [
      { name: 'product_id', type: 'SERIAL (PK)', desc: 'Unique product ID' },
      { name: 'name', type: 'TEXT', desc: 'Product title / model name' },
      { name: 'category', type: 'TEXT', desc: 'Category (Electronics, Audio, Furniture, etc.)' },
      { name: 'price', type: 'NUMERIC(10,2)', desc: 'Retail price in USD' },
      { name: 'stock_quantity', type: 'INTEGER', desc: 'Available units in warehouse' },
    ],
    sampleQuery: 'top 5 products by revenue',
  },
  {
    name: 'orders',
    description: 'Customer order transactions with shipping destination and status',
    columns: [
      { name: 'order_id', type: 'SERIAL (PK)', desc: 'Unique order ID' },
      { name: 'customer_id', type: 'INTEGER (FK)', desc: 'Customer identifier' },
      { name: 'order_date', type: 'DATE', desc: 'Date placed' },
      { name: 'status', type: 'TEXT', desc: 'Order status (delivered, shipped, processing)' },
      { name: 'shipping_country', type: 'TEXT', desc: 'Destination country' },
    ],
    sampleQuery: 'orders by country',
  },
  {
    name: 'order_items',
    description: 'Line items and sales quantities per order',
    columns: [
      { name: 'order_item_id', type: 'SERIAL (PK)', desc: 'Unique item row ID' },
      { name: 'order_id', type: 'INTEGER (FK)', desc: 'Parent order reference' },
      { name: 'product_id', type: 'INTEGER (FK)', desc: 'Purchased product reference' },
      { name: 'quantity', type: 'INTEGER', desc: 'Units purchased' },
      { name: 'unit_price', type: 'NUMERIC(10,2)', desc: 'Price charged per unit' },
    ],
    sampleQuery: 'monthly revenue trend',
  },
  {
    name: 'customers',
    description: 'Registered customer profiles and loyalty tiers',
    columns: [
      { name: 'customer_id', type: 'SERIAL (PK)', desc: 'Unique customer ID' },
      { name: 'name', type: 'TEXT', desc: 'Full customer name' },
      { name: 'email', type: 'TEXT', desc: 'Customer email address' },
      { name: 'region', type: 'TEXT', desc: 'Geographic market region' },
      { name: 'loyalty_tier', type: 'TEXT', desc: 'Tier (Bronze, Silver, Gold, Platinum)' },
      { name: 'signup_date', type: 'DATE', desc: 'Account registration date' },
    ],
    sampleQuery: 'customers by loyalty tier',
  },
];

export default function SchemaModal({ isOpen, onClose, dataset, onSelectQuery }) {
  const [selectedTable, setSelectedTable] = useState(dataset ? dataset.tableName : 'products');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '1.1rem' }}>🗄️</span>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                {dataset ? `Dataset Schema: ${dataset.tableName}` : 'Database Schema Explorer'}
              </h3>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
              {dataset
                ? `${dataset.rowCount.toLocaleString()} rows · ${dataset.columns.length} columns in memory`
                : 'Introspected from live Supabase PostgreSQL · Grounded in LLM prompts'}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#f8fafc', border: '1px solid #e2e8f0',
              color: '#64748b', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Table Selector Tabs (if database mode) */}
          {!dataset && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TABLES_METADATA.map(t => (
                <button
                  key={t.name}
                  onClick={() => setSelectedTable(t.name)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: selectedTable === t.name ? '#09090b' : '#f8fafc',
                    color: selectedTable === t.name ? '#ffffff' : '#475569',
                    border: `1px solid ${selectedTable === t.name ? '#09090b' : '#e2e8f0'}`,
                    transition: 'all 120ms ease',
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}

          {/* Columns Table */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '8px 12px', color: '#475569', fontWeight: 600 }}>Column</th>
                  <th style={{ padding: '8px 12px', color: '#475569', fontWeight: 600 }}>Type</th>
                  <th style={{ padding: '8px 12px', color: '#475569', fontWeight: 600 }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {dataset ? (
                  dataset.columns.map((col, idx) => (
                    <tr key={col.name} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#4f46e5' }}>
                        {col.name}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          background: col.type === 'NUMBER' ? '#eef2ff' : col.type === 'DATE' ? '#ecfdf5' : '#f1f5f9',
                          color: col.type === 'NUMBER' ? '#4f46e5' : col.type === 'DATE' ? '#059669' : '#475569',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontWeight: 600,
                        }}>
                          {col.type}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', color: '#64748b' }}>
                        Inferred from sample values
                      </td>
                    </tr>
                  ))
                ) : (
                  TABLES_METADATA.find(t => t.name === selectedTable)?.columns.map((col, idx) => (
                    <tr key={col.name} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#4f46e5' }}>
                        {col.name}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ fontSize: '0.68rem', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>
                          {col.type}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', color: '#64748b' }}>
                        {col.desc}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Quick Query CTA */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a' }}>Try a sample query on this table:</p>
              <p style={{ fontSize: '0.72rem', color: '#64748b' }}>
                "{TABLES_METADATA.find(t => t.name === selectedTable)?.sampleQuery || 'top 5 products by revenue'}"
              </p>
            </div>
            <button
              className="btn-antigravity"
              style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}
              onClick={() => {
                const q = TABLES_METADATA.find(t => t.name === selectedTable)?.sampleQuery || 'top 5 products by revenue';
                onClose();
                onSelectQuery(q);
              }}
            >
              Run Query ➔
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
