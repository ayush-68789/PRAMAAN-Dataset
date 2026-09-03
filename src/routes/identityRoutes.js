/**
 * Identity Routes
 *
 * Mounts:
 *   GET /api/identities
 *   GET /api/identities/:identityId
 *   GET /api/identities/:identityId/documents
 */

const express = require('express');
const router = express.Router();
const {
  getAllIdentities,
  getIdentityById,
  getIdentityDocuments,
} = require('../controllers/identityController');

router.get('/identities', getAllIdentities);
router.get('/identities/:identityId', getIdentityById);
router.get('/identities/:identityId/documents', getIdentityDocuments);

module.exports = router;
