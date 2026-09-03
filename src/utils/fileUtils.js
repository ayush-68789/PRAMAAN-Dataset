/**
 * File and directory utility helpers.
 *
 * Centralises all path constants and ensures the required dataset
 * directory tree exists before generation or API startup.
 */

const path = require('path');
const fs = require('fs');

// ── Root paths ──────────────────────────────────────────────────────
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DATASET_DIR = path.join(PROJECT_ROOT, 'dataset');

// ── Subdirectory layout ─────────────────────────────────────────────
const GENUINE_DIR = path.join(DATASET_DIR, 'genuine');
const TAMPERED_DIR = path.join(DATASET_DIR, 'tampered');

const GENUINE_SUBDIRS = {
  aadhaar: path.join(GENUINE_DIR, 'aadhaar'),
  pan: path.join(GENUINE_DIR, 'pan'),
  birth_certificate: path.join(GENUINE_DIR, 'birth_certificate'),
  school_certificate: path.join(GENUINE_DIR, 'school_certificate'),
};

const TAMPERED_SUBDIRS = {
  dob_change: path.join(TAMPERED_DIR, 'dob_change'),
  name_change: path.join(TAMPERED_DIR, 'name_change'),
  photo_change: path.join(TAMPERED_DIR, 'photo_change'),
};

const IDENTITIES_CSV = path.join(DATASET_DIR, 'identities.csv');
const METADATA_CSV = path.join(DATASET_DIR, 'metadata.csv');

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Recursively creates all required dataset directories.
 */
function ensureDirectories() {
  const dirs = [
    DATASET_DIR,
    GENUINE_DIR,
    TAMPERED_DIR,
    ...Object.values(GENUINE_SUBDIRS),
    ...Object.values(TAMPERED_SUBDIRS),
  ];

  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Resolve the absolute file path for a document given its metadata row.
 *
 * @param {object} meta  Row from metadata.csv
 * @returns {string}     Absolute path to the PNG file
 */
function getDocumentFilePath(meta) {
  const isTampered =
    meta.is_tampered === true ||
    meta.is_tampered === 'true';

  if (isTampered) {
    const subDir = TAMPERED_SUBDIRS[meta.tamper_type];
    if (!subDir) return null;
    return path.join(subDir, `${meta.document_id}.png`);
  }

  const subDir = GENUINE_SUBDIRS[meta.document_type];
  if (!subDir) return null;
  return path.join(subDir, `${meta.document_id}.png`);
}

/**
 * Remove the dataset/genuine and dataset/tampered trees so a fresh
 * generation starts clean, but keep the dataset/ root directory.
 */
function cleanDataset() {
  for (const dir of [GENUINE_DIR, TAMPERED_DIR]) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
  // Also remove old CSVs
  for (const csv of [IDENTITIES_CSV, METADATA_CSV]) {
    if (fs.existsSync(csv)) {
      fs.unlinkSync(csv);
    }
  }
}

module.exports = {
  PROJECT_ROOT,
  DATASET_DIR,
  GENUINE_DIR,
  TAMPERED_DIR,
  GENUINE_SUBDIRS,
  TAMPERED_SUBDIRS,
  IDENTITIES_CSV,
  METADATA_CSV,
  ensureDirectories,
  getDocumentFilePath,
  cleanDataset,
};
