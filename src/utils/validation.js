/**
 * Dataset validation.
 *
 * Runs a comprehensive suite of checks against the generated CSVs
 * and image files to guarantee dataset integrity before the API starts.
 */

const fs = require('fs');
const {
  GENUINE_SUBDIRS,
  TAMPERED_SUBDIRS,
  getDocumentFilePath,
} = require('./fileUtils');
const { loadIdentities, loadMetadata } = require('../services/metadataService');

/**
 * Validate the generated dataset.
 *
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateDataset() {
  const errors = [];

  // ── Load data ──────────────────────────────────────────────────
  let identities, metadata;
  try {
    identities = loadIdentities();
    metadata = loadMetadata();
  } catch (err) {
    return { valid: false, errors: [`Cannot load CSV files: ${err.message}`] };
  }

  // ── Count checks ──────────────────────────────────────────────
  if (identities.length !== 10) {
    errors.push(`Expected 10 identities, got ${identities.length}`);
  }

  const genuine = metadata.filter((r) => r.is_tampered === 'false');
  const tampered = metadata.filter((r) => r.is_tampered === 'true');

  if (genuine.length !== 40) {
    errors.push(`Expected 40 genuine docs, got ${genuine.length}`);
  }
  if (tampered.length !== 10) {
    errors.push(`Expected 10 tampered docs, got ${tampered.length}`);
  }

  const dobT = tampered.filter((r) => r.tamper_type === 'dob_change');
  const nameT = tampered.filter((r) => r.tamper_type === 'name_change');
  const photoT = tampered.filter((r) => r.tamper_type === 'photo_change');

  if (dobT.length !== 4) {
    errors.push(`Expected 4 DOB tampered, got ${dobT.length}`);
  }
  if (nameT.length !== 3) {
    errors.push(`Expected 3 name tampered, got ${nameT.length}`);
  }
  if (photoT.length !== 3) {
    errors.push(`Expected 3 photo tampered, got ${photoT.length}`);
  }

  // ── Unique document IDs ───────────────────────────────────────
  const docIds = metadata.map((r) => r.document_id);
  const uniqueIds = new Set(docIds);
  if (docIds.length !== uniqueIds.size) {
    errors.push('Duplicate document_id found');
  }

  // ── Valid identity IDs ────────────────────────────────────────
  const validIds = new Set(identities.map((i) => i.identity_id));
  for (const row of metadata) {
    if (!validIds.has(row.identity_id)) {
      errors.push(`${row.document_id} maps to invalid identity ${row.identity_id}`);
    }
  }

  // ── Every identity has 4 genuine docs ─────────────────────────
  const genuineCountByIdentity = {};
  for (const row of genuine) {
    genuineCountByIdentity[row.identity_id] =
      (genuineCountByIdentity[row.identity_id] || 0) + 1;
  }
  for (const iid of validIds) {
    if ((genuineCountByIdentity[iid] || 0) !== 4) {
      errors.push(
        `${iid} has ${genuineCountByIdentity[iid] || 0} genuine docs instead of 4`
      );
    }
  }

  // ── Tampered source validation ────────────────────────────────
  const genuineIds = new Set(genuine.map((r) => r.document_id));
  for (const row of tampered) {
    if (!row.source_document_id || !genuineIds.has(row.source_document_id)) {
      errors.push(
        `Tampered ${row.document_id} has invalid source ${row.source_document_id}`
      );
    }
  }

  // ── File existence ────────────────────────────────────────────
  for (const row of metadata) {
    const filePath = getDocumentFilePath(row);
    if (!filePath || !fs.existsSync(filePath)) {
      errors.push(`Missing file for ${row.document_id}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateDataset };
