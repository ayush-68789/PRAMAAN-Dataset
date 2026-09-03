/**
 * Synthetic Document Dataset API — Express Server
 *
 * Entry point for the REST API.  Loads dataset CSVs at startup,
 * validates the dataset, and mounts all route modules.
 *
 * Port is configurable via .env (default 5001).
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { IDENTITIES_CSV, METADATA_CSV } = require('./utils/fileUtils');
const { validateDataset } = require('./utils/validation');

const app = express();
const PORT = process.env.PORT || 5001;

// ── Middleware ───────────────────────────────────────────────────────

// CORS — allow all origins in development.
// In production, restrict to specific origins.
app.use(cors());

// JSON body parsing
app.use(express.json());

// ── Startup dataset check ───────────────────────────────────────────

if (!fs.existsSync(IDENTITIES_CSV) || !fs.existsSync(METADATA_CSV)) {
  console.error(
    '\n  ERROR: Dataset not found.\n' +
    '  Run "npm run generate" first to create the dataset.\n'
  );
  process.exit(1);
}

// Validate dataset integrity
const validation = validateDataset();
if (!validation.valid) {
  console.error('\n  DATASET VALIDATION FAILED:');
  for (const err of validation.errors) {
    console.error(`    x ${err}`);
  }
  console.error('\n  Re-run "npm run generate" to regenerate the dataset.\n');
  process.exit(1);
}

console.log('  Dataset validated successfully.\n');

// ── Routes ──────────────────────────────────────────────────────────

const documentRoutes = require('./routes/documentRoutes');
const identityRoutes = require('./routes/identityRoutes');
const testRoutes = require('./routes/testRoutes');

app.use('/api', documentRoutes);
app.use('/api', identityRoutes);
app.use('/api', testRoutes);

// ── Root endpoint ───────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({
    service: 'synthetic-document-api',
    version: '1.0.0',
    description: 'Privacy-safe synthetic document dataset REST API for SIH prototype.',
    endpoints: {
      health: 'GET /api/health',
      stats: 'GET /api/stats',
      documents: 'GET /api/documents',
      document_detail: 'GET /api/documents/:documentId',
      document_file: 'GET /api/documents/:documentId/file',
      identities: 'GET /api/identities',
      identity_detail: 'GET /api/identities/:identityId',
      identity_documents: 'GET /api/identities/:identityId/documents',
      test_random: 'GET /api/test/random',
      test_random_tampered: 'GET /api/test/random-tampered',
    },
  });
});

// ── 404 handler ─────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ── Global error handler ────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// ── Start listening ─────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(` Synthetic Document Dataset API`);
  console.log(`   Running on: http://localhost:${PORT}`);
  console.log(`   Endpoints:  http://localhost:${PORT}/api/health`);
  console.log('='.repeat(50));
});
