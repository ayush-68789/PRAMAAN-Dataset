/**
 * Dataset Generation Script
 *
 * Run with: npm run generate
 *
 * Creates the full synthetic document dataset:
 *   - 10 identities
 *   - 40 genuine documents (4 types × 10 identities)
 *   - 10 tampered documents (4 DOB + 3 name + 3 photo)
 *   - identities.csv & metadata.csv
 */

const { generateDataset } = require('../src/services/datasetGenerator');

generateDataset()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\nFATAL:', err.message);
    process.exit(1);
  });
