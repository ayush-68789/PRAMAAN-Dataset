/**
 * Metadata Service
 *
 * Reads and writes identities.csv and metadata.csv.
 * Provides synchronous in-memory loading for API use.
 */

const fs = require('fs');
const path = require('path');
const { IDENTITIES_CSV, METADATA_CSV } = require('../utils/fileUtils');

// ── CSV helpers ─────────────────────────────────────────────────────

/**
 * Parse a simple CSV string into an array of objects.
 * Handles quoted fields with commas inside them.
 *
 * @param {string} csvText
 * @returns {object[]}
 */
function parseCsv(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = line.split(',').map((v) => v.trim());
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[j] !== undefined ? values[j] : '';
    }
    rows.push(obj);
  }

  return rows;
}

/**
 * Serialise an array of objects to CSV text.
 *
 * @param {object[]} rows
 * @param {string[]} headers
 * @returns {string}
 */
function toCsv(rows, headers) {
  const headerLine = headers.join(',');
  const dataLines = rows.map((row) =>
    headers.map((h) => (row[h] !== undefined && row[h] !== null ? row[h] : '')).join(',')
  );
  return [headerLine, ...dataLines].join('\n') + '\n';
}

// ── Identity fields ─────────────────────────────────────────────────
const IDENTITY_HEADERS = ['identity_id', 'name', 'dob', 'father_name'];

// ── Metadata fields ─────────────────────────────────────────────────
const METADATA_HEADERS = [
  'document_id',
  'identity_id',
  'document_type',
  'name',
  'dob',
  'father_name',
  'is_tampered',
  'tamper_type',
  'source_document_id',
];

// ── Public API ──────────────────────────────────────────────────────

/**
 * Load identities from identities.csv (synchronous).
 * @returns {object[]}
 */
function loadIdentities() {
  const text = fs.readFileSync(IDENTITIES_CSV, 'utf-8');
  return parseCsv(text);
}

/**
 * Load all document metadata from metadata.csv (synchronous).
 * @returns {object[]}
 */
function loadMetadata() {
  const text = fs.readFileSync(METADATA_CSV, 'utf-8');
  return parseCsv(text);
}

/**
 * Write identities to identities.csv.
 * @param {object[]} identities
 */
function writeIdentitiesCsv(identities) {
  const csv = toCsv(identities, IDENTITY_HEADERS);
  fs.writeFileSync(IDENTITIES_CSV, csv, 'utf-8');
}

/**
 * Write document metadata to metadata.csv.
 * @param {object[]} rows
 */
function writeMetadataCsv(rows) {
  const csv = toCsv(rows, METADATA_HEADERS);
  fs.writeFileSync(METADATA_CSV, csv, 'utf-8');
}

module.exports = {
  loadIdentities,
  loadMetadata,
  writeIdentitiesCsv,
  writeMetadataCsv,
  IDENTITY_HEADERS,
  METADATA_HEADERS,
};
