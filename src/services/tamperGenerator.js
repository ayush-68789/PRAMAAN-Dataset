/**
 * Tamper Generator
 *
 * Creates 10 tampered documents from genuine originals:
 *   - 4 DOB changes
 *   - 3 name changes
 *   - 3 photo changes
 *
 * Never modifies genuine files — always produces new copies.
 */

const path = require('path');
const fs = require('fs');
const { TAMPERED_SUBDIRS } = require('../utils/fileUtils');
const {
  GENERATORS,
  PHOTO_TYPES,
} = require('./documentGenerator');

// ── Fake replacement names for name tampering ───────────────────────
const TAMPER_NAMES = [
  'Rahul Verma',
  'Priya Gupta',
  'Amit Singh',
  'Neha Yadav',
  'Vikas Mehta',
  'Ananya Kumar',
  'Rohan Patel',
  'Sneha Sharma',
  'Arjun Mishra',
  'Kavya Verma',
];

/**
 * Shift a DOB string by ±1–3 years deterministically.
 *
 * @param {string} originalDob  "YYYY-MM-DD"
 * @param {number} index        Used for deterministic variation
 * @returns {string}
 */
function tamperDob(originalDob, index) {
  const parts = originalDob.split('-');
  const year = parseInt(parts[0], 10);
  const deltas = [-1, 1, -2, 2, -3, 3];
  const delta = deltas[index % deltas.length];
  return `${year + delta}-${parts[1]}-${parts[2]}`;
}

/**
 * Generate all 10 tampered documents.
 *
 * @param {object[]} identities  Array of 10 identity objects
 * @param {object}   photos      Map identity_id → PNG Buffer
 * @returns {Promise<object[]>}  Metadata rows for the tampered documents
 */
async function generateTamperedDocuments(identities, photos) {
  const tamperSpecs = [];

  // ── 4 DOB tampering ───────────────────────────────────────────
  const dobTargets = [
    { identity: identities[0], docType: 'aadhaar', srcNum: 1 },
    { identity: identities[1], docType: 'pan', srcNum: 6 },
    { identity: identities[2], docType: 'birth_certificate', srcNum: 11 },
    { identity: identities[3], docType: 'school_certificate', srcNum: 16 },
  ];

  dobTargets.forEach((t, i) => {
    const newDob = tamperDob(t.identity.dob, i);
    tamperSpecs.push({
      tamperType: 'dob_change',
      identity: t.identity,
      docType: t.docType,
      sourceDocId: `DOC${String(t.srcNum).padStart(3, '0')}`,
      overrides: { dob: newDob },
      metaName: t.identity.name,
      metaDob: newDob,
    });
  });

  // ── 3 Name tampering ──────────────────────────────────────────
  const nameTargets = [
    { identity: identities[4], docType: 'aadhaar', srcNum: 17 },
    { identity: identities[5], docType: 'pan', srcNum: 22 },
    { identity: identities[6], docType: 'birth_certificate', srcNum: 27 },
  ];

  nameTargets.forEach((t) => {
    const idx = parseInt(t.identity.identity_id.replace('ID', ''), 10) - 1;
    const newName = TAMPER_NAMES[(idx + 5) % TAMPER_NAMES.length];
    tamperSpecs.push({
      tamperType: 'name_change',
      identity: t.identity,
      docType: t.docType,
      sourceDocId: `DOC${String(t.srcNum).padStart(3, '0')}`,
      overrides: { name: newName },
      metaName: newName,
      metaDob: t.identity.dob,
    });
  });

  // ── 3 Photo tampering (only on photo-bearing docs) ────────────
  const photoTargets = [
    { identity: identities[7], docType: 'aadhaar', srcNum: 29 },
    { identity: identities[8], docType: 'pan', srcNum: 34 },
    { identity: identities[9], docType: 'aadhaar', srcNum: 37 },
  ];

  photoTargets.forEach((t) => {
    const idx = parseInt(t.identity.identity_id.replace('ID', ''), 10) - 1;
    const donorIdx = (idx + 1) % identities.length;
    const donorId = identities[donorIdx].identity_id;
    tamperSpecs.push({
      tamperType: 'photo_change',
      identity: t.identity,
      docType: t.docType,
      sourceDocId: `DOC${String(t.srcNum).padStart(3, '0')}`,
      overrides: { photoBuffer: photos[donorId] },
      metaName: t.identity.name,
      metaDob: t.identity.dob,
    });
  });

  // ── Generate images and metadata ──────────────────────────────
  const metadataRows = [];
  let docCounter = 41;

  for (const spec of tamperSpecs) {
    const docId = `DOC${String(docCounter).padStart(3, '0')}`;
    docCounter++;

    const generator = GENERATORS[spec.docType];
    const isPhotoBearing = PHOTO_TYPES.has(spec.docType);

    let buffer;
    if (isPhotoBearing) {
      const photo = spec.overrides.photoBuffer || photos[spec.identity.identity_id];
      buffer = await generator(spec.identity, docId, photo, {
        name: spec.overrides.name,
        dob: spec.overrides.dob,
        photoBuffer: spec.overrides.photoBuffer,
      });
    } else {
      buffer = await generator(spec.identity, docId, {
        name: spec.overrides.name,
        dob: spec.overrides.dob,
      });
    }

    // Save to tampered/<type>/
    const outDir = TAMPERED_SUBDIRS[spec.tamperType];
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, `${docId}.png`), buffer);

    metadataRows.push({
      document_id: docId,
      identity_id: spec.identity.identity_id,
      document_type: spec.docType,
      name: spec.metaName,
      dob: spec.metaDob,
      father_name: spec.identity.father_name,
      is_tampered: 'true',
      tamper_type: spec.tamperType,
      source_document_id: spec.sourceDocId,
    });
  }

  return metadataRows;
}

module.exports = { generateTamperedDocuments };
