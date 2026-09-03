/**
 * Test Controller
 *
 * Provides convenience endpoints for testing the document
 * verification pipeline from the main SIH application.
 */

const { loadIdentities, loadMetadata } = require('../services/metadataService');

/**
 * GET /api/test/random
 *
 * Returns a randomly selected identity and its genuine documents
 * with downloadable file URLs.
 */
function getRandomIdentity(req, res) {
  try {
    const identities = loadIdentities();
    const metadata = loadMetadata();

    // Pick a random identity
    const identity = identities[Math.floor(Math.random() * identities.length)];

    // Get all genuine documents for this identity
    const documents = metadata
      .filter(
        (r) =>
          r.identity_id === identity.identity_id &&
          r.is_tampered === 'false'
      )
      .map((r) => ({
        document_id: r.document_id,
        document_type: r.document_type,
        file_url: `/api/documents/${r.document_id}/file`,
      }));

    res.json({
      identity_id: identity.identity_id,
      documents,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load random identity' });
  }
}

/**
 * GET /api/test/random-tampered
 *
 * Returns a randomly selected tampered document with its
 * ground-truth metadata for testing tamper detection.
 */
function getRandomTampered(req, res) {
  try {
    const metadata = loadMetadata();

    const tampered = metadata.filter((r) => r.is_tampered === 'true');
    if (tampered.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No tampered documents found',
      });
    }

    const doc = tampered[Math.floor(Math.random() * tampered.length)];

    res.json({
      document_id: doc.document_id,
      identity_id: doc.identity_id,
      document_type: doc.document_type,
      tamper_type: doc.tamper_type,
      source_document_id: doc.source_document_id || null,
      file_url: `/api/documents/${doc.document_id}/file`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to load random tampered document',
    });
  }
}

module.exports = {
  getRandomIdentity,
  getRandomTampered,
};
