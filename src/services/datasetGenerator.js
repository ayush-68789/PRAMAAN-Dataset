/**
 * Dataset Generator (orchestrator)
 *
 * Coordinates the full pipeline:
 *   1. Clean previous data
 *   2. Create directories
 *   3. Generate 10 identities → identities.csv
 *   4. Generate 10 synthetic photos
 *   5. Generate 40 genuine documents
 *   6. Generate 10 tampered documents
 *   7. Write metadata.csv
 *   8. Validate
 *   9. Print summary
 */

const fs = require('fs');
const path = require('path');
const {
  ensureDirectories,
  cleanDataset,
  GENUINE_SUBDIRS,
} = require('../utils/fileUtils');
const { writeIdentitiesCsv, writeMetadataCsv } = require('./metadataService');
const { generatePhoto } = require('./photoGenerator');
const {
  generateAadhaarDocument,
  generatePanDocument,
  generateBirthCertificate,
  generateSchoolCertificate,
} = require('./documentGenerator');
const { generateTamperedDocuments } = require('./tamperGenerator');
const { validateDataset } = require('../utils/validation');

// ── Document type ordering ──────────────────────────────────────────
const DOCUMENT_TYPES = ['aadhaar', 'pan', 'birth_certificate', 'school_certificate'];

// ── 10 deterministic fictional identities ───────────────────────────
const HARDCODED_IDENTITIES = [
  { identity_id: 'ID001', name: 'Rahul Sharma', dob: '2003-05-14', father_name: 'Rajesh Sharma' },
  { identity_id: 'ID002', name: 'Priya Verma', dob: '2002-11-21', father_name: 'Suresh Verma' },
  { identity_id: 'ID003', name: 'Amit Kumar', dob: '2003-07-19', father_name: 'Ramesh Kumar' },
  { identity_id: 'ID004', name: 'Neha Singh', dob: '2002-03-12', father_name: 'Mahesh Singh' },
  { identity_id: 'ID005', name: 'Vikas Gupta', dob: '2003-09-25', father_name: 'Anil Gupta' },
  { identity_id: 'ID006', name: 'Ananya Patel', dob: '2002-12-08', father_name: 'Manoj Patel' },
  { identity_id: 'ID007', name: 'Rohan Yadav', dob: '2003-02-17', father_name: 'Sunil Yadav' },
  { identity_id: 'ID008', name: 'Sneha Mishra', dob: '2002-08-30', father_name: 'Deepak Mishra' },
  { identity_id: 'ID009', name: 'Arjun Mehta', dob: '2003-06-11', father_name: 'Prakash Mehta' },
  { identity_id: 'ID010', name: 'Kavya Sharma', dob: '2002-10-05', father_name: 'Ashok Sharma' },
];

/**
 * Run the complete dataset generation pipeline.
 */
async function generateDataset() {
  console.log('='.repeat(50));
  console.log(' SYNTHETIC DOCUMENT DATASET GENERATOR');
  console.log('='.repeat(50));

  // Step 1: Clean previous data
  console.log('\n[1/7] Cleaning previous dataset...');
  cleanDataset();

  // Step 2: Create directories
  console.log('[2/7] Creating directories...');
  ensureDirectories();

  // Step 3: Generate identities
  console.log('[3/7] Generating identities...');
  const identities = [...HARDCODED_IDENTITIES];
  writeIdentitiesCsv(identities);
  console.log(`  > ${identities.length} identities saved to identities.csv`);

  // Step 4: Generate synthetic photos
  console.log('[4/7] Creating synthetic photos...');
  const photos = {};
  for (const identity of identities) {
    photos[identity.identity_id] = await generatePhoto(identity);
  }
  console.log(`  > ${Object.keys(photos).length} synthetic avatar photos`);

  // Step 5: Generate 40 genuine documents
  console.log('[5/7] Generating 40 genuine documents...');
  const genuineMetadata = [];
  let docCounter = 1;

  for (const identity of identities) {
    const iid = identity.identity_id;
    const photo = photos[iid];

    for (const docType of DOCUMENT_TYPES) {
      const docId = `DOC${String(docCounter).padStart(3, '0')}`;
      docCounter++;

      let buffer;
      switch (docType) {
        case 'aadhaar':
          buffer = await generateAadhaarDocument(identity, docId, photo);
          break;
        case 'pan':
          buffer = await generatePanDocument(identity, docId, photo);
          break;
        case 'birth_certificate':
          buffer = await generateBirthCertificate(identity, docId);
          break;
        case 'school_certificate':
          buffer = await generateSchoolCertificate(identity, docId);
          break;
      }

      const outDir = GENUINE_SUBDIRS[docType];
      fs.writeFileSync(path.join(outDir, `${docId}.png`), buffer);

      genuineMetadata.push({
        document_id: docId,
        identity_id: iid,
        document_type: docType,
        name: identity.name,
        dob: identity.dob,
        father_name: identity.father_name,
        is_tampered: 'false',
        tamper_type: 'none',
        source_document_id: '',
      });
    }
  }
  console.log(`  > ${genuineMetadata.length} genuine documents saved`);

  // Step 6: Generate 10 tampered documents
  console.log('[6/7] Generating 10 tampered documents...');
  const tamperedMetadata = await generateTamperedDocuments(identities, photos);
  console.log(`  > ${tamperedMetadata.length} tampered documents saved`);

  // Step 7: Write metadata.csv
  console.log('[7/7] Writing metadata.csv...');
  const allMetadata = [...genuineMetadata, ...tamperedMetadata];
  writeMetadataCsv(allMetadata);
  console.log(`  > ${allMetadata.length} rows written to metadata.csv`);

  // Validate
  console.log('\nValidating dataset...');
  const result = validateDataset();
  if (!result.valid) {
    console.error('\nVALIDATION FAILED:');
    for (const err of result.errors) {
      console.error(`  x ${err}`);
    }
    throw new Error(`Dataset validation failed with ${result.errors.length} error(s)`);
  }
  console.log('  > All validation checks passed');

  // Summary
  const tamperedRows = allMetadata.filter((r) => r.is_tampered === 'true');
  const dobC = tamperedRows.filter((r) => r.tamper_type === 'dob_change').length;
  const nameC = tamperedRows.filter((r) => r.tamper_type === 'name_change').length;
  const photoC = tamperedRows.filter((r) => r.tamper_type === 'photo_change').length;

  console.log('\n' + '='.repeat(50));
  console.log(' SYNTHETIC DATASET GENERATED');
  console.log('='.repeat(50));
  console.log(`
Identities:          ${identities.length}
Genuine Documents:   ${genuineMetadata.length}
Tampered Documents:  ${tamperedRows.length}

  DOB Changes:       ${dobC}
  Name Changes:      ${nameC}
  Photo Changes:     ${photoC}

Total Documents:     ${allMetadata.length}

Dataset API Ready:   YES
`);
  console.log('='.repeat(50));
}

module.exports = { generateDataset, HARDCODED_IDENTITIES, DOCUMENT_TYPES };
