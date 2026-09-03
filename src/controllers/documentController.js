/**
 * Document Controller
 *
 * Handles all /api/documents and /api/health and /api/stats endpoints.
 */

const fs = require('fs');
const path = require('path');
const { loadMetadata } = require('../services/metadataService');
const { getDocumentFilePath } = require('../utils/fileUtils');

/**
 * GET /api/health
 */
function getHealth(req, res) {
  res.json({
    status: 'ok',
    service: 'synthetic-document-api',
  });
}

/**
 * GET /api/stats
 */
function getStats(req, res) {
  try {
    const metadata = loadMetadata();
    const { loadIdentities } = require('../services/metadataService');
    const identities = loadIdentities();

    const genuine = metadata.filter((r) => r.is_tampered === 'false');
    const tampered = metadata.filter((r) => r.is_tampered === 'true');

    res.json({
      identities: identities.length,
      total_documents: metadata.length,
      genuine_documents: genuine.length,
      tampered_documents: tampered.length,
      tampering: {
        dob_change: tampered.filter((r) => r.tamper_type === 'dob_change').length,
        name_change: tampered.filter((r) => r.tamper_type === 'name_change').length,
        photo_change: tampered.filter((r) => r.tamper_type === 'photo_change').length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load dataset stats' });
  }
}

/**
 * GET /api/documents
 *
 * Optional query filters:
 *   ?document_type=aadhaar
 *   ?tampered=true
 *   ?identity_id=ID001
 */
function getAllDocuments(req, res) {
  try {
    let metadata = loadMetadata();

    // Apply filters
    const { document_type, tampered, identity_id } = req.query;

    if (document_type) {
      metadata = metadata.filter((r) => r.document_type === document_type);
    }

    if (tampered !== undefined) {
      const isTampered = tampered === 'true' ? 'true' : 'false';
      metadata = metadata.filter((r) => r.is_tampered === isTampered);
    }

    if (identity_id) {
      metadata = metadata.filter((r) => r.identity_id === identity_id);
    }

    const documents = metadata.map((r) => ({
      document_id: r.document_id,
      identity_id: r.identity_id,
      document_type: r.document_type,
      is_tampered: r.is_tampered === 'true',
      tamper_type: r.tamper_type,
    }));

    res.json({ documents });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load documents' });
  }
}

/**
 * GET /api/documents/:documentId
 */
function getDocumentById(req, res) {
  try {
    const { documentId } = req.params;
    const metadata = loadMetadata();
    const doc = metadata.find((r) => r.document_id === documentId);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: `Document ${documentId} not found`,
      });
    }

    res.json({
      document_id: doc.document_id,
      identity_id: doc.identity_id,
      document_type: doc.document_type,
      name: doc.name,
      dob: doc.dob,
      father_name: doc.father_name,
      is_tampered: doc.is_tampered === 'true',
      tamper_type: doc.tamper_type,
      source_document_id: doc.source_document_id || null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load document' });
  }
}

/**
 * GET /api/documents/:documentId/file
 *
 * Returns the actual PNG image file.
 */
function getDocumentFile(req, res) {
  try {
    const { documentId } = req.params;
    const metadata = loadMetadata();
    const doc = metadata.find((r) => r.document_id === documentId);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: `Document ${documentId} not found`,
      });
    }

    const filePath = getDocumentFilePath(doc);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: `File for ${documentId} not found on disk`,
      });
    }

    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to serve document file' });
  }
}

module.exports = {
  getHealth,
  getStats,
  getAllDocuments,
  getDocumentById,
  getDocumentFile,
};
