/**
 * Test Routes
 *
 * Mounts:
 *   GET /api/test/random
 *   GET /api/test/random-tampered
 */

const express = require('express');
const router = express.Router();
const {
  getRandomIdentity,
  getRandomTampered,
} = require('../controllers/testController');

router.get('/test/random', getRandomIdentity);
router.get('/test/random-tampered', getRandomTampered);

module.exports = router;
