const router = require('express').Router();
const challengeController = require('../controllers/challenge.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(verifyToken);

// Send challenge to friend
router.post('/challenge', challengeController.sendChallenge);

// Accept challenge
router.post('/accept/:challengeId', challengeController.acceptChallenge);

// Decline challenge
router.post('/decline/:challengeId', challengeController.declineChallenge);

// Get pending challenges
router.get('/challenges/pending', challengeController.getPendingChallenges);

// Get active challenges
router.get('/challenges/active', challengeController.getActiveChallenges);

module.exports = router;
