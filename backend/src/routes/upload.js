/**
 * routes/upload.js — POST /api/upload
 *
 * Accepts CSV or Excel files, parses them, infers column types,
 * stores in the in-memory datasetStore, and returns the schema.
 *
 * Max file size: 5MB
 * Supported formats: .csv, .tsv, .txt (comma/tab separated)
 */

const express   = require('express');
const multer    = require('multer');
const { parse } = require('csv-parse/sync');
const { setDataset, formatDatasetSchema } = require('../services/datasetStore');
const path = require('path');

const router = express.Router();

// Memory storage — we parse the buffer directly, no temp files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.csv', '.tsv', '.txt'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV/TSV files are supported. Excel (.xlsx) support coming soon.'));
    }
  },
});

/**
 * Infer column type from sample values.
 * @param {string[]} samples
 * @returns {'NUMBER' | 'DATE' | 'TEXT'}
 */
function inferType(samples) {
  const nonEmpty = samples.filter(v => v !== '' && v !== null && v !== undefined);
  if (nonEmpty.length === 0) return 'TEXT';

  const isNumber = nonEmpty.every(v => !isNaN(Number(v)) && v.trim() !== '');
  if (isNumber) return 'NUMBER';

  const isDate = nonEmpty.every(v => {
    const d = new Date(v);
    return !isNaN(d.getTime()) && /\d{4}/.test(v);
  });
  if (isDate) return 'DATE';

  return 'TEXT';
}

/**
 * Clean column name — strips special chars, trims, lowercases.
 */
function cleanColName(raw) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/^_+|_+$/g, '') || 'col';
}

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Send a multipart/form-data request with field "file".' });
  }

  const filename = req.file.originalname;
  const ext = path.extname(filename).toLowerCase();

  let records;
  try {
    const delimiter = ext === '.tsv' ? '\t' : ',';
    records = parse(req.file.buffer.toString('utf-8'), {
      delimiter,
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: false, // keep everything as string for now, we coerce later
      bom: true,   // handle Excel-exported CSVs with BOM
    });
  } catch (parseErr) {
    return res.status(422).json({ error: `Failed to parse CSV: ${parseErr.message}` });
  }

  if (!records || records.length === 0) {
    return res.status(422).json({ error: 'The file appears to be empty or has no data rows.' });
  }

  // Clean column names
  const rawCols = Object.keys(records[0]);
  const cleanedColMap = {}; // rawName → cleanName
  rawCols.forEach(raw => { cleanedColMap[raw] = cleanColName(raw); });

  // Rename all records
  const rows = records.map(rec => {
    const cleaned = {};
    rawCols.forEach(raw => { cleaned[cleanedColMap[raw]] = rec[raw]; });
    return cleaned;
  });

  // Infer column types from first 50 rows
  const sample = rows.slice(0, 50);
  const columns = Object.values(cleanedColMap).map(col => {
    const vals = sample.map(r => r[col]);
    return { name: col, type: inferType(vals) };
  });

  // Coerce values to proper JS types
  const typedRows = rows.map(row => {
    const out = {};
    columns.forEach(({ name, type }) => {
      const raw = row[name];
      if (raw === '' || raw === null || raw === undefined) {
        out[name] = null;
      } else if (type === 'NUMBER') {
        out[name] = Number(raw);
      } else if (type === 'DATE') {
        out[name] = new Date(raw).toISOString().slice(0, 10);
      } else {
        out[name] = raw;
      }
    });
    return out;
  });

  // Get tablename from filename
  const tableName = path.basename(filename, ext)
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 32) || 'data';

  const dataset = {
    name: tableName,
    originalFilename: filename,
    rows: typedRows,
    columns,
    uploadedAt: new Date().toISOString(),
  };

  setDataset(dataset);

  console.log(`[upload] Stored dataset "${tableName}": ${typedRows.length} rows, ${columns.length} columns`);

  res.json({
    message: 'Dataset uploaded successfully.',
    tableName,
    rowCount: typedRows.length,
    columns,
    preview: typedRows.slice(0, 5),
    schema: formatDatasetSchema(dataset),
  });
});

// GET /api/upload — return current dataset info (or null)
router.get('/', (req, res) => {
  const { getDataset, formatDatasetSchema } = require('../services/datasetStore');
  const ds = getDataset();
  if (!ds) return res.json({ dataset: null });
  res.json({
    dataset: {
      name: ds.name,
      originalFilename: ds.originalFilename,
      rowCount: ds.rows.length,
      columns: ds.columns,
      uploadedAt: ds.uploadedAt,
      schema: formatDatasetSchema(ds),
      preview: ds.rows.slice(0, 5),
    },
  });
});

// DELETE /api/upload — clear current dataset
router.delete('/', (req, res) => {
  const { clearDataset } = require('../services/datasetStore');
  clearDataset();
  res.json({ message: 'Dataset cleared.' });
});

module.exports = router;
