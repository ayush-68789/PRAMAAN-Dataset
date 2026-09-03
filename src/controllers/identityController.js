/**
 * Identity Controller
 *
 * Handles all /api/identities endpoints.
 */

const { loadIdentities, loadMetadata } = require('../services/metadataService');

/**
 * GET /api/identities
 */
function getAllIdentities(req, res) {
  try {
    const identities = loadIdentities();

    res.json({
      identities: identities.map((i) => ({
        identity_id: i.identity_id,
        name: i.name,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load identities' });
  }
}

/**
 * GET /api/identities/:identityId
 */
function getIdentityById(req, res) {
  try {
    const { identityId } = req.params;
    const identities = loadIdentities();
    const identity = identities.find((i) => i.identity_id === identityId);

    if (!identity) {
      return res.status(404).json({
        success: false,
        message: `Identity ${identityId} not found`,
      });
    }

    // Find all documents for this identity
    const metadata = loadMetadata();
    const documents = metadata
      .filter((r) => r.identity_id === identityId)
      .map((r) => r.document_id);

    res.json({
      identity_id: identity.identity_id,
      name: identity.name,
      dob: identity.dob,
      father_name: identity.father_name,
      documents,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load identity' });
  }
}

/**
 * GET /api/identities/:identityId/documents
 */
function getIdentityDocuments(req, res) {
  try {
    const { identityId } = req.params;
    const identities = loadIdentities();
    const identity = identities.find((i) => i.identity_id === identityId);

    if (!identity) {
      return res.status(404).json({
        success: false,
        message: `Identity ${identityId} not found`,
      });
    }

    const metadata = loadMetadata();
    const documents = metadata
      .filter((r) => r.identity_id === identityId)
      .map((r) => ({
        document_id: r.document_id,
        document_type: r.document_type,
        is_tampered: r.is_tampered === 'true',
      }));

    res.json({
      identity_id: identityId,
      documents,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load identity documents' });
  }
}

module.exports = {
  getAllIdentities,
  getIdentityById,
  getIdentityDocuments,
};
