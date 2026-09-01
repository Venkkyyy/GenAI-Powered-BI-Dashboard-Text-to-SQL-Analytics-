/**
 * services/datasetStore.js
 *
 * In-memory store for uploaded CSV/Excel datasets.
 * Each session can have one active dataset.
 * The dataset is used instead of Supabase when present.
 */

/** @type {{ name: string, rows: object[], columns: {name:string,type:string}[], uploadedAt: string } | null} */
let _dataset = null;

function setDataset(dataset) {
  _dataset = dataset;
}

function getDataset() {
  return _dataset;
}

function clearDataset() {
  _dataset = null;
}

/**
 * Format the dataset schema into a DDL-like string for the LLM.
 */
function formatDatasetSchema(dataset) {
  const cols = dataset.columns.map(c => `  ${c.name} ${c.type}`).join(',\n');
  return `TABLE ${dataset.name} (\n${cols}\n) -- ${dataset.rows.length} rows`;
}

module.exports = { setDataset, getDataset, clearDataset, formatDatasetSchema };
