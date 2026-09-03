/**
 * Document Routes
 *
 * Mounts:
 *   GET /api/health
 *   GET /api/stats
 *   GET /api/documents
 *   GET /api/documents/:documentId
 *   GET /api/documents/:documentId/file
 */
const express = require('express');
const router = express.Router();
const {
  getHealth,
  getStats,
  getAllDocuments,
  getDocumentById,
  getDocumentFile,
} = require('../controllers/documentController');

router.get('/health', getHealth);
router.get('/stats', getStats);
router.get('/documents', getAllDocuments);
router.get('/documents/:documentId', getDocumentById);
router.get('/documents/:documentId/file', getDocumentFile);

module.exports = router;
